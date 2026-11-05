-- =========================================================================
-- Persona SaaS — Hardening de segurança e integridade (2026-11-05)
-- =========================================================================
-- Idempotente. Execute no SQL Editor do Supabase DEPOIS de:
--   onboarding_submissions.sql, subscriptions.sql, appointment_requests.sql,
--   reservation_requests.sql, conversion_requests.sql, landing_testimonials.sql
--
-- O que muda:
--   1. landing_testimonials: remove policy "using (true)"; só o dono gerencia.
--   2. appointment_requests: valida no servidor dia/horário contra a agenda
--      configurada no payload (regras, intervalos, bloqueios, passado).
--   3. reservation_requests: bloqueia datas passadas e períodos absurdos.
--   4. Anti-spam: limite de pedidos públicos por WhatsApp/página.
--   5. Pedidos públicos só para páginas no ar (trial válido ou assinatura).
--   6. onboarding_submissions: aplica accounts.max_pages, impede publicar sem
--      conta ativa e impede trocar owner_id.
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. Depoimentos: gestão restrita ao dono da página
-- -------------------------------------------------------------------------
drop policy if exists "Dashboard MVP can manage landing testimonials" on public.landing_testimonials;
drop policy if exists "Owners can read own landing testimonials" on public.landing_testimonials;
drop policy if exists "Owners can insert landing testimonials" on public.landing_testimonials;
drop policy if exists "Owners can update landing testimonials" on public.landing_testimonials;
drop policy if exists "Owners can delete landing testimonials" on public.landing_testimonials;

create policy "Owners can read own landing testimonials"
on public.landing_testimonials for select
to authenticated
using (exists (
  select 1 from public.onboarding_submissions os
  where os.slug = submission_slug and os.owner_id = auth.uid()
));

create policy "Owners can insert landing testimonials"
on public.landing_testimonials for insert
to authenticated
with check (
  (status <> 'active' or authorized = true)
  and exists (
    select 1 from public.onboarding_submissions os
    where os.slug = submission_slug and os.owner_id = auth.uid()
  )
);

create policy "Owners can update landing testimonials"
on public.landing_testimonials for update
to authenticated
using (exists (
  select 1 from public.onboarding_submissions os
  where os.slug = submission_slug and os.owner_id = auth.uid()
))
with check (
  (status <> 'active' or authorized = true)
  and exists (
    select 1 from public.onboarding_submissions os
    where os.slug = submission_slug and os.owner_id = auth.uid()
  )
);

create policy "Owners can delete landing testimonials"
on public.landing_testimonials for delete
to authenticated
using (exists (
  select 1 from public.onboarding_submissions os
  where os.slug = submission_slug and os.owner_id = auth.uid()
));

revoke all on public.landing_testimonials from anon, authenticated;
grant select on public.landing_testimonials to anon;
grant select, insert, update, delete on public.landing_testimonials to authenticated;

-- -------------------------------------------------------------------------
-- Helpers
-- -------------------------------------------------------------------------
-- Fuso horário da página (payload.timezone), padrão America/Sao_Paulo.
create or replace function public.page_timezone(p_payload jsonb)
returns text
language plpgsql
stable
as $$
declare
  tz text := nullif(trim(coalesce(p_payload->>'timezone', p_payload->'businesses'->>'timezone', '')), '');
begin
  if tz is null or not exists (select 1 from pg_timezone_names where name = tz) then
    return 'America/Sao_Paulo';
  end if;
  return tz;
end;
$$;

-- Anti-spam genérico: conta pedidos recentes do mesmo WhatsApp na página.
create or replace function public.assert_public_request_rate(
  p_table regclass,
  p_slug text,
  p_whatsapp text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  per_whatsapp int;
  per_page int;
begin
  execute format(
    'select count(*) from %s where submission_slug = $1 and customer_whatsapp = $2 and created_at > now() - interval ''1 hour''',
    p_table
  ) into per_whatsapp using p_slug, p_whatsapp;

  if per_whatsapp >= 3 then
    raise exception 'Você já enviou várias solicitações recentemente. Aguarde um pouco ou fale direto pelo WhatsApp.'
      using errcode = 'P0429';
  end if;

  execute format(
    'select count(*) from %s where submission_slug = $1 and created_at > now() - interval ''10 minutes''',
    p_table
  ) into per_page using p_slug;

  if per_page >= 30 then
    raise exception 'Muitas solicitações nesta página agora. Tente novamente em alguns minutos.'
      using errcode = 'P0429';
  end if;
end;
$$;

revoke all on function public.assert_public_request_rate(regclass, text, text) from public, anon, authenticated;

-- -------------------------------------------------------------------------
-- 2. Agendamentos: validação no servidor
-- -------------------------------------------------------------------------
create or replace function public.validate_appointment_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sub record;
  tz text;
  local_now timestamp;
  wd int;
  rule jsonb;
  rule_start int;
  rule_end int;
  step int;
  slot int;
  found_rule boolean := false;
begin
  -- Donos editando status não passam por aqui (trigger só em insert).
  select owner_id, payload into sub
  from public.onboarding_submissions
  where slug = new.submission_slug and status in ('preview', 'published')
  limit 1;

  if not found then
    raise exception 'Página não encontrada.' using errcode = 'P0404';
  end if;

  if not public.account_is_live(sub.owner_id) then
    raise exception 'Esta página não está recebendo agendamentos no momento.' using errcode = 'P0403';
  end if;

  perform public.assert_public_request_rate('public.appointment_requests', new.submission_slug, new.customer_whatsapp);

  if char_length(trim(new.customer_name)) < 3 or char_length(new.customer_name) > 120 then
    raise exception 'Informe seu nome completo.' using errcode = 'P0422';
  end if;

  tz := public.page_timezone(sub.payload);
  local_now := now() at time zone tz;

  if (new.appointment_date + new.start_time) <= local_now then
    raise exception 'Este horário já passou. Escolha outro horário.' using errcode = 'P0422';
  end if;

  if new.appointment_date > (local_now::date + 365) then
    raise exception 'Escolha uma data dentro dos próximos 12 meses.' using errcode = 'P0422';
  end if;

  -- Bloqueio de data específica
  if exists (
    select 1 from jsonb_array_elements(coalesce(sub.payload->'availability_date_blocks', '[]'::jsonb)) b
    where b->>'date' = to_char(new.appointment_date, 'YYYY-MM-DD')
  ) then
    raise exception 'Não há atendimento nesta data.' using errcode = 'P0422';
  end if;

  wd := extract(dow from new.appointment_date)::int;
  slot := extract(hour from new.start_time)::int * 60 + extract(minute from new.start_time)::int;

  -- Regra do dia da semana (mesma lógica do front: grade start..end inclusive)
  for rule in
    select r from jsonb_array_elements(coalesce(sub.payload->'availability_rules', '[]'::jsonb)) r
    where (r->>'weekday')::int = wd
      and coalesce((r->>'is_active')::boolean, true)
  loop
    rule_start := extract(hour from (rule->>'start_time')::time)::int * 60 + extract(minute from (rule->>'start_time')::time)::int;
    rule_end := extract(hour from (rule->>'end_time')::time)::int * 60 + extract(minute from (rule->>'end_time')::time)::int;
    step := greatest(coalesce(nullif(rule->>'interval_minutes', '')::int, 30), 5);
    if slot >= rule_start and slot <= rule_end and (slot - rule_start) % step = 0 then
      found_rule := true;
      exit;
    end if;
  end loop;

  if not found_rule then
    raise exception 'Horário fora da agenda de atendimento.' using errcode = 'P0422';
  end if;

  -- Intervalos (almoço etc.)
  if exists (
    select 1 from jsonb_array_elements(coalesce(sub.payload->'availability_breaks', '[]'::jsonb)) b
    where (b->>'weekday')::int = wd
      and new.start_time >= (b->>'start_time')::time
      and new.start_time < (b->>'end_time')::time
  ) then
    raise exception 'Horário indisponível (intervalo de atendimento).' using errcode = 'P0422';
  end if;

  -- Campos controlados pelo servidor
  new.status := 'pending';
  new.source := 'preview_landing';
  return new;
end;
$$;

drop trigger if exists validate_appointment_request on public.appointment_requests;
create trigger validate_appointment_request
before insert on public.appointment_requests
for each row execute function public.validate_appointment_request();

-- -------------------------------------------------------------------------
-- 3. Reservas por período
-- -------------------------------------------------------------------------
create or replace function public.validate_reservation_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sub record;
  local_today date;
begin
  select owner_id, payload into sub
  from public.onboarding_submissions
  where slug = new.submission_slug and status in ('preview', 'published')
  limit 1;

  if not found then
    raise exception 'Página não encontrada.' using errcode = 'P0404';
  end if;

  if not public.account_is_live(sub.owner_id) then
    raise exception 'Esta página não está recebendo reservas no momento.' using errcode = 'P0403';
  end if;

  perform public.assert_public_request_rate('public.reservation_requests', new.submission_slug, new.customer_whatsapp);

  local_today := (now() at time zone public.page_timezone(sub.payload))::date;

  if new.start_date < local_today then
    raise exception 'A data de início já passou.' using errcode = 'P0422';
  end if;
  if new.start_date > local_today + 730 then
    raise exception 'Escolha datas dentro dos próximos 2 anos.' using errcode = 'P0422';
  end if;
  if new.end_date - new.start_date > 90 then
    raise exception 'O período máximo de reserva é de 90 dias.' using errcode = 'P0422';
  end if;

  if exists (
    select 1 from jsonb_array_elements(coalesce(sub.payload->'availability_date_blocks', '[]'::jsonb)) b
    where (b->>'date') ~ '^\d{4}-\d{2}-\d{2}$'
      and (b->>'date')::date between new.start_date and new.end_date
  ) then
    raise exception 'O período escolhido inclui datas indisponíveis.' using errcode = 'P0422';
  end if;

  new.status := 'pending';
  new.source := 'preview_landing';
  return new;
end;
$$;

drop trigger if exists validate_reservation_request on public.reservation_requests;
create trigger validate_reservation_request
before insert on public.reservation_requests
for each row execute function public.validate_reservation_request();

-- -------------------------------------------------------------------------
-- 4. Solicitações comerciais
-- -------------------------------------------------------------------------
create or replace function public.validate_conversion_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.page_is_live(new.submission_slug) then
    raise exception 'Esta página não está recebendo solicitações no momento.' using errcode = 'P0403';
  end if;

  perform public.assert_public_request_rate('public.conversion_requests', new.submission_slug, new.customer_whatsapp);

  if pg_column_size(new.payload) > 8000 then
    raise exception 'Solicitação muito grande.' using errcode = 'P0422';
  end if;

  new.status := 'new';
  new.source := 'preview_landing';
  return new;
end;
$$;

drop trigger if exists validate_conversion_request on public.conversion_requests;
create trigger validate_conversion_request
before insert on public.conversion_requests
for each row execute function public.validate_conversion_request();

-- -------------------------------------------------------------------------
-- 5. Páginas: limite do plano, publicação e owner imutável
-- -------------------------------------------------------------------------
create or replace function public.enforce_submission_plan_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  acc record;
  page_count int;
begin
  -- service_role (webhooks/admin) não é limitado
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  if tg_op = 'UPDATE' and new.owner_id is distinct from old.owner_id then
    raise exception 'Não é permitido transferir a página.' using errcode = 'P0403';
  end if;

  select * into acc from public.accounts where owner_id = new.owner_id;

  if tg_op = 'INSERT' then
    select count(*) into page_count
    from public.onboarding_submissions
    where owner_id = new.owner_id;

    if page_count >= coalesce(acc.max_pages, 1) then
      raise exception 'Seu plano permite até % página(s). Faça upgrade para criar mais.', coalesce(acc.max_pages, 1)
        using errcode = 'P0402';
    end if;
  end if;

  if new.status = 'published'
     and (tg_op = 'INSERT' or old.status is distinct from 'published')
     and not public.account_is_live(new.owner_id) then
    raise exception 'Ative sua assinatura para publicar a página.' using errcode = 'P0402';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_submission_plan_rules on public.onboarding_submissions;
create trigger enforce_submission_plan_rules
before insert or update on public.onboarding_submissions
for each row execute function public.enforce_submission_plan_rules();

notify pgrst, 'reload schema';

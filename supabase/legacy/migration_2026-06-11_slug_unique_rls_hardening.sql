-- =====================================================================
-- MIGRACAO: slug unico + consolidacao definitiva de RLS
-- Data: 2026-06-11
--
-- Motivo de seguranca (critico):
-- As policies de appointment_requests, reservation_requests,
-- conversion_requests e landing_testimonials validam o dono via
-- "slug + owner_id". Sem unicidade de slug, um usuario autenticado
-- poderia criar uma pagina com o mesmo slug de outra pessoa e ler ou
-- alterar os dados dos clientes dela (nome, WhatsApp, agendamentos).
--
-- Este arquivo e idempotente: pode ser executado mais de uma vez.
-- Execute no SQL Editor do Supabase. Ele substitui a necessidade de
-- reexecutar security_auth_rls.sql.
-- =====================================================================

-- =========================
-- 1. Deduplicar slugs existentes
-- =========================
-- Mantem o registro mais recente com o slug original (mesmo criterio do
-- runtime, que carrega a submissao mais recente por slug). Registros
-- duplicados mais antigos recebem sufixo derivado do proprio id, para
-- continuarem acessiveis sem colidir.

with ranked as (
  select
    id,
    slug,
    row_number() over (
      partition by slug
      order by created_at desc, id desc
    ) as rn
  from public.onboarding_submissions
)
update public.onboarding_submissions os
set slug = os.slug || '-' || substr(replace(os.id::text, '-', ''), 1, 6)
from ranked r
where os.id = r.id
  and r.rn > 1;

-- =========================
-- 2. Unicidade do slug
-- =========================

create unique index if not exists onboarding_submissions_slug_unique
on public.onboarding_submissions (slug);

-- =========================
-- 3. Onboarding submissions: remover policies permissivas legadas
-- =========================

alter table public.onboarding_submissions enable row level security;

drop policy if exists "Public can create onboarding submissions" on public.onboarding_submissions;
drop policy if exists "Public can read onboarding previews" on public.onboarding_submissions;
drop policy if exists "Public can update onboarding submissions" on public.onboarding_submissions;
drop policy if exists "Anon can read public onboarding previews" on public.onboarding_submissions;
drop policy if exists "Authenticated owners can create onboarding submissions" on public.onboarding_submissions;
drop policy if exists "Authenticated owners can read own onboarding submissions" on public.onboarding_submissions;
drop policy if exists "Authenticated owners can update own onboarding submissions" on public.onboarding_submissions;
drop policy if exists "Authenticated owners can delete own onboarding submissions" on public.onboarding_submissions;

create policy "Anon can read public onboarding previews"
on public.onboarding_submissions for select
to anon
using (status in ('preview', 'published'));

create policy "Authenticated owners can create onboarding submissions"
on public.onboarding_submissions for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Authenticated owners can read own onboarding submissions"
on public.onboarding_submissions for select
to authenticated
using (owner_id = auth.uid());

create policy "Authenticated owners can update own onboarding submissions"
on public.onboarding_submissions for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Authenticated owners can delete own onboarding submissions"
on public.onboarding_submissions for delete
to authenticated
using (owner_id = auth.uid());

revoke all on public.onboarding_submissions from anon, authenticated;
grant select on public.onboarding_submissions to anon;
grant select, insert, update, delete on public.onboarding_submissions to authenticated;

-- =========================
-- 4. Appointment requests: remover policies MVP "using (true)"
-- =========================

alter table public.appointment_requests enable row level security;

drop policy if exists "Public can create appointment requests" on public.appointment_requests;
drop policy if exists "Public can read appointment requests for management MVP" on public.appointment_requests;
drop policy if exists "Public can update appointment requests for management MVP" on public.appointment_requests;
drop policy if exists "Authenticated can read appointment requests" on public.appointment_requests;
drop policy if exists "Authenticated can update appointment requests" on public.appointment_requests;
drop policy if exists "Anon can create appointment requests" on public.appointment_requests;
drop policy if exists "Authenticated owners can read own appointment requests" on public.appointment_requests;
drop policy if exists "Authenticated owners can update own appointment requests" on public.appointment_requests;

create policy "Anon can create appointment requests"
on public.appointment_requests for insert
to anon
with check (
  status = 'pending'
  and source = 'preview_landing'
  and exists (
    select 1
    from public.onboarding_submissions os
    where os.slug = submission_slug
      and os.status in ('preview', 'published')
  )
);

create policy "Authenticated owners can read own appointment requests"
on public.appointment_requests for select
to authenticated
using (
  exists (
    select 1
    from public.onboarding_submissions os
    where os.slug = submission_slug
      and os.owner_id = auth.uid()
  )
);

create policy "Authenticated owners can update own appointment requests"
on public.appointment_requests for update
to authenticated
using (
  exists (
    select 1
    from public.onboarding_submissions os
    where os.slug = submission_slug
      and os.owner_id = auth.uid()
  )
)
with check (
  status in ('pending', 'confirmed', 'cancelled', 'completed')
  and exists (
    select 1
    from public.onboarding_submissions os
    where os.slug = submission_slug
      and os.owner_id = auth.uid()
  )
);

revoke all on public.appointment_requests from anon, authenticated;
grant insert on public.appointment_requests to anon;
grant select, update on public.appointment_requests to authenticated;
grant select on public.public_appointment_slots to anon, authenticated;

notify pgrst, 'reload schema';

-- =====================================================================
-- Verificacao pos-migracao (rode manualmente e confira os resultados):
--
-- 1. Nenhum slug duplicado:
--    select slug, count(*) from public.onboarding_submissions
--    group by slug having count(*) > 1;
--
-- 2. Nenhuma policy permissiva remanescente:
--    select tablename, policyname from pg_policies
--    where schemaname = 'public'
--      and (qual = 'true' or with_check = 'true');
-- =====================================================================

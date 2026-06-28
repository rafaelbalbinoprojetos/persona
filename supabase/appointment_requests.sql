-- Solicitações públicas de agendamento feitas pelas páginas geradas.
-- Execute no SQL Editor do Supabase antes de testar o cadastro na landing.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.appointment_requests (
  id uuid primary key default gen_random_uuid(),
  submission_slug text not null,
  business_name text not null,
  customer_name text not null,
  customer_whatsapp text not null,
  appointment_date date not null,
  start_time time not null,
  status text not null default 'pending',
  source text not null default 'preview_landing',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointment_requests_slug_format check (submission_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint appointment_requests_status_valid check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  constraint appointment_requests_whatsapp_valid check (customer_whatsapp ~ '^[0-9]{10,13}$')
);

drop trigger if exists set_appointment_requests_updated_at on public.appointment_requests;

create trigger set_appointment_requests_updated_at
before update on public.appointment_requests
for each row execute function public.set_updated_at();

create index if not exists appointment_requests_slug_date_idx
on public.appointment_requests (submission_slug, appointment_date);

create index if not exists appointment_requests_status_idx
on public.appointment_requests (status);

-- Impede dois agendamentos ativos no mesmo slug/data/horario.
create unique index if not exists appointment_requests_slot_unique
on public.appointment_requests (submission_slug, appointment_date, start_time)
where status in ('pending', 'confirmed');

-- View publica apenas com horarios ocupados, sem dados pessoais do cliente.
drop view if exists public.public_appointment_slots;

create view public.public_appointment_slots as
select
  submission_slug,
  appointment_date,
  start_time,
  status
from public.appointment_requests
where status in ('pending', 'confirmed');

alter table public.appointment_requests enable row level security;

drop policy if exists "Public can create appointment requests" on public.appointment_requests;
drop policy if exists "Public can read appointment requests for management MVP" on public.appointment_requests;
drop policy if exists "Public can update appointment requests for management MVP" on public.appointment_requests;
drop policy if exists "Authenticated can read appointment requests" on public.appointment_requests;
drop policy if exists "Authenticated can update appointment requests" on public.appointment_requests;

drop policy if exists "Anon can create appointment requests" on public.appointment_requests;
drop policy if exists "Authenticated owners can read own appointment requests" on public.appointment_requests;
drop policy if exists "Authenticated owners can update own appointment requests" on public.appointment_requests;

-- Insercao anonima apenas para paginas publicaveis existentes.
create policy "Anon can create appointment requests"
on public.appointment_requests for insert
to anon, authenticated
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

-- Leitura e atualizacao restritas ao dono da pagina (slug e unico).
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

grant usage on schema public to anon, authenticated;
revoke all on public.appointment_requests from anon, authenticated;
grant insert on public.appointment_requests to anon, authenticated;
grant select, update on public.appointment_requests to authenticated;
grant select on public.public_appointment_slots to anon, authenticated;

notify pgrst, 'reload schema';

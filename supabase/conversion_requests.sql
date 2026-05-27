-- Solicitações flexíveis do módulo Conversão/Atendimento.
-- Use para modos request, consultation e lead.
-- O modo appointment continua usando public.appointment_requests.

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

create table if not exists public.conversion_requests (
  id uuid primary key default gen_random_uuid(),
  submission_slug text not null,
  business_name text not null,
  conversion_mode text not null,
  customer_name text not null,
  customer_whatsapp text not null,
  customer_email text,
  status text not null default 'new',
  source text not null default 'preview_landing',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversion_requests_slug_format check (submission_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint conversion_requests_mode_valid check (conversion_mode in ('request', 'consultation', 'lead')),
  constraint conversion_requests_status_valid check (status in ('new', 'contacted', 'qualified', 'archived')),
  constraint conversion_requests_whatsapp_valid check (customer_whatsapp ~ '^[0-9]{10,13}$')
);

drop trigger if exists set_conversion_requests_updated_at on public.conversion_requests;

create trigger set_conversion_requests_updated_at
before update on public.conversion_requests
for each row execute function public.set_updated_at();

create index if not exists conversion_requests_slug_status_idx
on public.conversion_requests (submission_slug, status, created_at desc);

alter table public.conversion_requests enable row level security;

drop policy if exists "Anon can create conversion requests" on public.conversion_requests;
drop policy if exists "Authenticated owners can read own conversion requests" on public.conversion_requests;
drop policy if exists "Authenticated owners can update own conversion requests" on public.conversion_requests;
drop policy if exists "Authenticated owners can delete own conversion requests" on public.conversion_requests;

create policy "Anon can create conversion requests"
on public.conversion_requests for insert
to anon, authenticated
with check (
  source = 'preview_landing'
  and status = 'new'
  and exists (
    select 1
    from public.onboarding_submissions os
    where os.slug = submission_slug
      and os.status in ('preview', 'published')
  )
);

create policy "Authenticated owners can read own conversion requests"
on public.conversion_requests for select
to authenticated
using (
  exists (
    select 1
    from public.onboarding_submissions os
    where os.slug = submission_slug
      and os.owner_id = auth.uid()
  )
);

create policy "Authenticated owners can update own conversion requests"
on public.conversion_requests for update
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
  status in ('new', 'contacted', 'qualified', 'archived')
  and exists (
    select 1
    from public.onboarding_submissions os
    where os.slug = submission_slug
      and os.owner_id = auth.uid()
  )
);

create policy "Authenticated owners can delete own conversion requests"
on public.conversion_requests for delete
to authenticated
using (
  exists (
    select 1
    from public.onboarding_submissions os
    where os.slug = submission_slug
      and os.owner_id = auth.uid()
  )
);

revoke all on public.conversion_requests from anon, authenticated;
grant insert on public.conversion_requests to anon;
grant select, insert, update, delete on public.conversion_requests to authenticated;

notify pgrst, 'reload schema';

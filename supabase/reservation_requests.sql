-- Reservas publicas por periodo para hospedagens, sitios e espacos.
-- Execute no SQL Editor do Supabase depois de supabase/onboarding_submissions.sql.

create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.reservation_requests (
  id uuid primary key default gen_random_uuid(),
  submission_slug text not null,
  business_name text not null,
  customer_name text not null,
  customer_whatsapp text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'pending',
  source text not null default 'preview_landing',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reservation_requests_slug_format check (submission_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint reservation_requests_status_valid check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  constraint reservation_requests_whatsapp_valid check (customer_whatsapp ~ '^[0-9]{10,13}$'),
  constraint reservation_requests_period_valid check (start_date <= end_date)
);

drop trigger if exists set_reservation_requests_updated_at on public.reservation_requests;
create trigger set_reservation_requests_updated_at
before update on public.reservation_requests
for each row execute function public.set_updated_at();

create index if not exists reservation_requests_slug_dates_idx
on public.reservation_requests (submission_slug, start_date, end_date);

-- Impede reservas pendentes ou confirmadas com datas sobrepostas na mesma pagina.
alter table public.reservation_requests
drop constraint if exists reservation_requests_no_overlap;

alter table public.reservation_requests
add constraint reservation_requests_no_overlap
exclude using gist (
  submission_slug with =,
  daterange(start_date, end_date, '[]') with &&
)
where (status in ('pending', 'confirmed'));

drop view if exists public.public_reservation_ranges;
create view public.public_reservation_ranges as
select submission_slug, start_date, end_date
from public.reservation_requests
where status in ('pending', 'confirmed');

alter table public.reservation_requests enable row level security;

drop policy if exists "Anon can create reservation requests" on public.reservation_requests;
drop policy if exists "Authenticated owners can read own reservation requests" on public.reservation_requests;
drop policy if exists "Authenticated owners can update own reservation requests" on public.reservation_requests;

create policy "Anon can create reservation requests"
on public.reservation_requests for insert
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

create policy "Authenticated owners can read own reservation requests"
on public.reservation_requests for select
to authenticated
using (
  exists (
    select 1
    from public.onboarding_submissions os
    where os.slug = submission_slug
      and os.owner_id = auth.uid()
  )
);

create policy "Authenticated owners can update own reservation requests"
on public.reservation_requests for update
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

revoke all on public.reservation_requests from anon, authenticated;
grant insert on public.reservation_requests to anon;
grant select, insert, update on public.reservation_requests to authenticated;
grant select on public.public_reservation_ranges to anon, authenticated;

notify pgrst, 'reload schema';

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

create table if not exists public.landing_testimonials (
  id uuid primary key default gen_random_uuid(),
  submission_slug text not null,
  customer_name text,
  public_initials text,
  photo_url text,
  testimonial_text text not null,
  rating integer not null default 5,
  related_service text,
  authorized boolean not null default false,
  status text not null default 'draft',
  featured boolean not null default false,
  source text not null default 'dashboard',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint landing_testimonials_slug_format check (submission_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint landing_testimonials_rating_valid check (rating between 1 and 5),
  constraint landing_testimonials_status_valid check (status in ('draft', 'pending', 'active', 'inactive')),
  constraint landing_testimonials_active_requires_authorization check (status <> 'active' or authorized = true),
  constraint landing_testimonials_text_size check (char_length(testimonial_text) between 12 and 420)
);

create index if not exists landing_testimonials_slug_idx
on public.landing_testimonials (submission_slug);

create index if not exists landing_testimonials_public_idx
on public.landing_testimonials (submission_slug, status, featured, created_at desc);

create trigger set_landing_testimonials_updated_at
before update on public.landing_testimonials
for each row execute function public.set_updated_at();

alter table public.landing_testimonials enable row level security;

drop policy if exists "Public can read active landing testimonials" on public.landing_testimonials;
create policy "Public can read active landing testimonials"
on public.landing_testimonials for select
using (status = 'active' and authorized = true);

-- MVP atual: o dashboard ainda usa a anon key e filtra tudo pelo submission_slug.
-- Em producao, troque estas policies de gestao para authenticated + checagem de owner/tenant.
drop policy if exists "Dashboard MVP can manage landing testimonials" on public.landing_testimonials;
create policy "Dashboard MVP can manage landing testimonials"
on public.landing_testimonials for all
using (true)
with check (status <> 'active' or authorized = true);

grant select, insert, update, delete on public.landing_testimonials to anon, authenticated;

notify pgrst, 'reload schema';

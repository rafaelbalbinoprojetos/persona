-- SorrisoPro / SaaS de agendamento multi-tenant
-- VERSÃO CORRIGIDA E IDEMPOTENTE (pode ser executada com segurança quantas vezes quiser).
-- Execute este arquivo no SQL Editor do Supabase.
--
-- O que mudou em relação ao schema.sql original:
--  1. Todos os "create trigger" agora têm "drop trigger if exists" antes
--     (o Postgres NÃO aceita "create trigger if not exists").
--  2. Todos os "create policy" agora têm "drop policy if exists" antes
--     (o Postgres NÃO aceita "create policy if not exists").
--  3. O bloco da tabela "onboarding_submissions" foi REMOVIDO daqui.
--     Essa tabela e suas policies são gerenciadas pelos arquivos:
--       - supabase/onboarding_submissions.sql
--       - supabase/security_auth_rls.sql
--     Isso evita o conflito de trigger duplicado que fazia o schema dar
--     rollback inteiro, e evita reintroduzir as policies públicas inseguras.

create extension if not exists "pgcrypto";

-- =========================
-- Enums
-- =========================

do $$
begin
  create type public.business_status as enum ('trial', 'active', 'paused', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.appointment_status as enum ('pending', 'confirmed', 'cancelled', 'completed', 'no_show', 'rescheduled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.appointment_source as enum ('landing_page', 'admin_panel', 'whatsapp', 'manual');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.availability_exception_type as enum ('blocked', 'extra_available', 'holiday', 'vacation');
exception
  when duplicate_object then null;
end $$;

-- =========================
-- Helpers
-- =========================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================
-- Core tenant
-- =========================

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  segment text not null default 'odontologia',
  description text,
  phone text,
  whatsapp text,
  email text,
  document text,
  status public.business_status not null default 'trial',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint businesses_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

drop trigger if exists set_businesses_updated_at on public.businesses;
create trigger set_businesses_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();

create or replace function public.is_business_owner(target_business_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.businesses b
    where b.id = target_business_id
      and b.owner_id = auth.uid()
  );
$$;

create table if not exists public.business_branding (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  logo_url text,
  favicon_url text,
  primary_color text not null default '#1c8dff',
  secondary_color text not null default '#7657de',
  accent_color text not null default '#20c7a8',
  font_family text not null default 'Inter',
  hero_title text,
  hero_subtitle text,
  hero_image_url text,
  cta_primary_text text not null default 'Agendar consulta',
  cta_secondary_text text not null default 'Conhecer servicos',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_business_branding_updated_at on public.business_branding;
create trigger set_business_branding_updated_at
before update on public.business_branding
for each row execute function public.set_updated_at();

create table if not exists public.business_locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null default 'Unidade principal',
  address text,
  city text,
  state text,
  zip_code text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  is_main boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_business_locations_updated_at on public.business_locations;
create trigger set_business_locations_updated_at
before update on public.business_locations
for each row execute function public.set_updated_at();

create table if not exists public.business_media (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  media_type text not null,
  title text,
  alt_text text,
  url text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_business_media_updated_at on public.business_media;
create trigger set_business_media_updated_at
before update on public.business_media
for each row execute function public.set_updated_at();

-- =========================
-- Services
-- =========================

create table if not exists public.service_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_service_categories_updated_at on public.service_categories;
create trigger set_service_categories_updated_at
before update on public.service_categories
for each row execute function public.set_updated_at();

create or replace function public.validate_service_category_business()
returns trigger
language plpgsql
as $$
begin
  if new.category_id is not null and not exists (
    select 1
    from public.service_categories sc
    where sc.id = new.category_id
      and sc.business_id = new.business_id
  ) then
    raise exception 'category_id does not belong to the same business_id';
  end if;

  return new;
end;
$$;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category_id uuid references public.service_categories(id) on delete set null,
  name text not null,
  description text,
  duration_minutes integer not null default 30,
  price numeric(10, 2),
  image_url text,
  icon text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_duration_positive check (duration_minutes > 0),
  constraint services_price_non_negative check (price is null or price >= 0)
);

drop trigger if exists set_services_updated_at on public.services;
create trigger set_services_updated_at
before update on public.services
for each row execute function public.set_updated_at();

drop trigger if exists validate_services_business on public.services;
create trigger validate_services_business
before insert or update on public.services
for each row execute function public.validate_service_category_business();

-- =========================
-- Professionals
-- =========================

create table if not exists public.professionals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  bio text,
  specialty text,
  photo_url text,
  phone text,
  email text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_professionals_updated_at on public.professionals;
create trigger set_professionals_updated_at
before update on public.professionals
for each row execute function public.set_updated_at();

create or replace function public.validate_professional_service_business()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.professionals p
    where p.id = new.professional_id
      and p.business_id = new.business_id
  ) then
    raise exception 'professional_id does not belong to the same business_id';
  end if;

  if not exists (
    select 1
    from public.services s
    where s.id = new.service_id
      and s.business_id = new.business_id
  ) then
    raise exception 'service_id does not belong to the same business_id';
  end if;

  return new;
end;
$$;

create or replace function public.validate_professional_business()
returns trigger
language plpgsql
as $$
begin
  if new.professional_id is not null and not exists (
    select 1
    from public.professionals p
    where p.id = new.professional_id
      and p.business_id = new.business_id
  ) then
    raise exception 'professional_id does not belong to the same business_id';
  end if;

  return new;
end;
$$;

create table if not exists public.professional_services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  professional_id uuid not null references public.professionals(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  custom_price numeric(10, 2),
  custom_duration_minutes integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (professional_id, service_id),
  constraint professional_services_duration_positive check (custom_duration_minutes is null or custom_duration_minutes > 0),
  constraint professional_services_price_non_negative check (custom_price is null or custom_price >= 0)
);

drop trigger if exists set_professional_services_updated_at on public.professional_services;
create trigger set_professional_services_updated_at
before update on public.professional_services
for each row execute function public.set_updated_at();

drop trigger if exists validate_professional_services_business on public.professional_services;
create trigger validate_professional_services_business
before insert or update on public.professional_services
for each row execute function public.validate_professional_service_business();

-- =========================
-- Availability
-- =========================

create table if not exists public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  professional_id uuid not null references public.professionals(id) on delete cascade,
  weekday integer not null,
  start_time time not null,
  end_time time not null,
  interval_minutes integer not null default 30,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint availability_rules_weekday_valid check (weekday between 0 and 6),
  constraint availability_rules_time_valid check (start_time < end_time),
  constraint availability_rules_interval_valid check (interval_minutes > 0)
);

drop trigger if exists set_availability_rules_updated_at on public.availability_rules;
create trigger set_availability_rules_updated_at
before update on public.availability_rules
for each row execute function public.set_updated_at();

drop trigger if exists validate_availability_rules_business on public.availability_rules;
create trigger validate_availability_rules_business
before insert or update on public.availability_rules
for each row execute function public.validate_professional_business();

create table if not exists public.availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  professional_id uuid references public.professionals(id) on delete cascade,
  exception_date date not null,
  start_time time,
  end_time time,
  type public.availability_exception_type not null,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint availability_exceptions_time_pair check (
    (start_time is null and end_time is null)
    or (start_time is not null and end_time is not null and start_time < end_time)
  )
);

drop trigger if exists set_availability_exceptions_updated_at on public.availability_exceptions;
create trigger set_availability_exceptions_updated_at
before update on public.availability_exceptions
for each row execute function public.set_updated_at();

drop trigger if exists validate_availability_exceptions_business on public.availability_exceptions;
create trigger validate_availability_exceptions_business
before insert or update on public.availability_exceptions
for each row execute function public.validate_professional_business();

-- =========================
-- Customers and appointments
-- =========================

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  birth_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_customers_updated_at on public.customers;
create trigger set_customers_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

create or replace function public.validate_appointment_business()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.customers c
    where c.id = new.customer_id
      and c.business_id = new.business_id
  ) then
    raise exception 'customer_id does not belong to the same business_id';
  end if;

  if not exists (
    select 1
    from public.professionals p
    where p.id = new.professional_id
      and p.business_id = new.business_id
  ) then
    raise exception 'professional_id does not belong to the same business_id';
  end if;

  if not exists (
    select 1
    from public.services s
    where s.id = new.service_id
      and s.business_id = new.business_id
  ) then
    raise exception 'service_id does not belong to the same business_id';
  end if;

  if new.location_id is not null and not exists (
    select 1
    from public.business_locations l
    where l.id = new.location_id
      and l.business_id = new.business_id
  ) then
    raise exception 'location_id does not belong to the same business_id';
  end if;

  return new;
end;
$$;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  professional_id uuid not null references public.professionals(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  location_id uuid references public.business_locations(id) on delete set null,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status public.appointment_status not null default 'pending',
  source public.appointment_source not null default 'landing_page',
  notes text,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_time_valid check (start_time < end_time)
);

drop trigger if exists set_appointments_updated_at on public.appointments;
create trigger set_appointments_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

drop trigger if exists validate_appointments_business on public.appointments;
create trigger validate_appointments_business
before insert or update on public.appointments
for each row execute function public.validate_appointment_business();

-- Evita dois agendamentos ativos no mesmo profissional/data/horario.
create unique index if not exists appointments_professional_slot_unique
on public.appointments (professional_id, appointment_date, start_time)
where status in ('pending', 'confirmed');

-- =========================
-- Landing content
-- =========================

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_name text not null,
  customer_role text,
  rating integer not null default 5,
  comment text not null,
  photo_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint testimonials_rating_valid check (rating between 1 and 5)
);

drop trigger if exists set_testimonials_updated_at on public.testimonials;
create trigger set_testimonials_updated_at
before update on public.testimonials
for each row execute function public.set_updated_at();

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  question text not null,
  answer text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_faqs_updated_at on public.faqs;
create trigger set_faqs_updated_at
before update on public.faqs
for each row execute function public.set_updated_at();

create table if not exists public.landing_sections (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  section_key text not null,
  title text,
  subtitle text,
  content jsonb not null default '{}'::jsonb,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, section_key)
);

drop trigger if exists set_landing_sections_updated_at on public.landing_sections;
create trigger set_landing_sections_updated_at
before update on public.landing_sections
for each row execute function public.set_updated_at();

create table if not exists public.business_settings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  timezone text not null default 'America/Sao_Paulo',
  currency text not null default 'BRL',
  appointment_confirmation_required boolean not null default true,
  allow_public_booking boolean not null default true,
  min_booking_notice_minutes integer not null default 60,
  max_booking_days_ahead integer not null default 60,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_settings_min_notice_valid check (min_booking_notice_minutes >= 0),
  constraint business_settings_days_ahead_valid check (max_booking_days_ahead > 0)
);

drop trigger if exists set_business_settings_updated_at on public.business_settings;
create trigger set_business_settings_updated_at
before update on public.business_settings
for each row execute function public.set_updated_at();

-- NOTA: a tabela public.onboarding_submissions foi intencionalmente removida
-- deste arquivo. Crie-a com supabase/onboarding_submissions.sql e proteja-a
-- com supabase/security_auth_rls.sql (que também aplica o slug único e as
-- policies por dono). Manter aqui causava o trigger duplicado que fazia o
-- script inteiro dar rollback no SQL Editor do Supabase.

-- =========================
-- Indexes
-- =========================

create index if not exists businesses_owner_id_idx on public.businesses(owner_id);
create index if not exists businesses_slug_idx on public.businesses(slug);
create index if not exists service_categories_business_id_idx on public.service_categories(business_id);
create index if not exists services_business_id_idx on public.services(business_id);
create index if not exists professionals_business_id_idx on public.professionals(business_id);
create index if not exists professional_services_business_id_idx on public.professional_services(business_id);
create index if not exists professional_services_professional_id_idx on public.professional_services(professional_id);
create index if not exists professional_services_service_id_idx on public.professional_services(service_id);
create index if not exists availability_rules_business_id_idx on public.availability_rules(business_id);
create index if not exists availability_rules_professional_weekday_idx on public.availability_rules(professional_id, weekday);
create index if not exists availability_exceptions_business_date_idx on public.availability_exceptions(business_id, exception_date);
create index if not exists customers_business_id_idx on public.customers(business_id);
create index if not exists customers_phone_idx on public.customers(phone);
create index if not exists appointments_business_date_idx on public.appointments(business_id, appointment_date);
create index if not exists appointments_professional_date_idx on public.appointments(professional_id, appointment_date);
create index if not exists testimonials_business_id_idx on public.testimonials(business_id);
create index if not exists faqs_business_id_idx on public.faqs(business_id);
create index if not exists landing_sections_business_id_idx on public.landing_sections(business_id);

-- =========================
-- Row Level Security
-- =========================

alter table public.businesses enable row level security;
alter table public.business_branding enable row level security;
alter table public.business_locations enable row level security;
alter table public.business_media enable row level security;
alter table public.service_categories enable row level security;
alter table public.services enable row level security;
alter table public.professionals enable row level security;
alter table public.professional_services enable row level security;
alter table public.availability_rules enable row level security;
alter table public.availability_exceptions enable row level security;
alter table public.customers enable row level security;
alter table public.appointments enable row level security;
alter table public.testimonials enable row level security;
alter table public.faqs enable row level security;
alter table public.landing_sections enable row level security;
alter table public.business_settings enable row level security;

-- businesses
drop policy if exists "Public can read active businesses" on public.businesses;
create policy "Public can read active businesses"
on public.businesses for select
using (status = 'active');

drop policy if exists "Owners can read own businesses" on public.businesses;
create policy "Owners can read own businesses"
on public.businesses for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "Authenticated users can create businesses" on public.businesses;
create policy "Authenticated users can create businesses"
on public.businesses for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "Owners can update own businesses" on public.businesses;
create policy "Owners can update own businesses"
on public.businesses for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Owners can delete own businesses" on public.businesses;
create policy "Owners can delete own businesses"
on public.businesses for delete
to authenticated
using (owner_id = auth.uid());

-- Public landing reads
drop policy if exists "Public can read branding for active businesses" on public.business_branding;
create policy "Public can read branding for active businesses"
on public.business_branding for select
using (exists (select 1 from public.businesses b where b.id = business_id and b.status = 'active'));

drop policy if exists "Public can read locations for active businesses" on public.business_locations;
create policy "Public can read locations for active businesses"
on public.business_locations for select
using (exists (select 1 from public.businesses b where b.id = business_id and b.status = 'active'));

drop policy if exists "Public can read active media for active businesses" on public.business_media;
create policy "Public can read active media for active businesses"
on public.business_media for select
using (is_active and exists (select 1 from public.businesses b where b.id = business_id and b.status = 'active'));

drop policy if exists "Public can read active service categories" on public.service_categories;
create policy "Public can read active service categories"
on public.service_categories for select
using (is_active and exists (select 1 from public.businesses b where b.id = business_id and b.status = 'active'));

drop policy if exists "Public can read active services" on public.services;
create policy "Public can read active services"
on public.services for select
using (is_active and exists (select 1 from public.businesses b where b.id = business_id and b.status = 'active'));

drop policy if exists "Public can read active professionals" on public.professionals;
create policy "Public can read active professionals"
on public.professionals for select
using (is_active and exists (select 1 from public.businesses b where b.id = business_id and b.status = 'active'));

drop policy if exists "Public can read active professional services" on public.professional_services;
create policy "Public can read active professional services"
on public.professional_services for select
using (is_active and exists (select 1 from public.businesses b where b.id = business_id and b.status = 'active'));

drop policy if exists "Public can read active availability rules" on public.availability_rules;
create policy "Public can read active availability rules"
on public.availability_rules for select
using (is_active and exists (select 1 from public.businesses b where b.id = business_id and b.status = 'active'));

drop policy if exists "Public can read availability exceptions for active businesses" on public.availability_exceptions;
create policy "Public can read availability exceptions for active businesses"
on public.availability_exceptions for select
using (exists (select 1 from public.businesses b where b.id = business_id and b.status = 'active'));

drop policy if exists "Public can read active testimonials" on public.testimonials;
create policy "Public can read active testimonials"
on public.testimonials for select
using (is_active and exists (select 1 from public.businesses b where b.id = business_id and b.status = 'active'));

drop policy if exists "Public can read active faqs" on public.faqs;
create policy "Public can read active faqs"
on public.faqs for select
using (is_active and exists (select 1 from public.businesses b where b.id = business_id and b.status = 'active'));

drop policy if exists "Public can read visible landing sections" on public.landing_sections;
create policy "Public can read visible landing sections"
on public.landing_sections for select
using (is_visible and exists (select 1 from public.businesses b where b.id = business_id and b.status = 'active'));

drop policy if exists "Public can read public settings for active businesses" on public.business_settings;
create policy "Public can read public settings for active businesses"
on public.business_settings for select
using (exists (select 1 from public.businesses b where b.id = business_id and b.status = 'active'));

-- Owner full management policies for tenant-scoped tables.
drop policy if exists "Owners can manage branding" on public.business_branding;
create policy "Owners can manage branding"
on public.business_branding for all
to authenticated
using (public.is_business_owner(business_id))
with check (public.is_business_owner(business_id));

drop policy if exists "Owners can manage locations" on public.business_locations;
create policy "Owners can manage locations"
on public.business_locations for all
to authenticated
using (public.is_business_owner(business_id))
with check (public.is_business_owner(business_id));

drop policy if exists "Owners can manage media" on public.business_media;
create policy "Owners can manage media"
on public.business_media for all
to authenticated
using (public.is_business_owner(business_id))
with check (public.is_business_owner(business_id));

drop policy if exists "Owners can manage service categories" on public.service_categories;
create policy "Owners can manage service categories"
on public.service_categories for all
to authenticated
using (public.is_business_owner(business_id))
with check (public.is_business_owner(business_id));

drop policy if exists "Owners can manage services" on public.services;
create policy "Owners can manage services"
on public.services for all
to authenticated
using (public.is_business_owner(business_id))
with check (public.is_business_owner(business_id));

drop policy if exists "Owners can manage professionals" on public.professionals;
create policy "Owners can manage professionals"
on public.professionals for all
to authenticated
using (public.is_business_owner(business_id))
with check (public.is_business_owner(business_id));

drop policy if exists "Owners can manage professional services" on public.professional_services;
create policy "Owners can manage professional services"
on public.professional_services for all
to authenticated
using (public.is_business_owner(business_id))
with check (public.is_business_owner(business_id));

drop policy if exists "Owners can manage availability rules" on public.availability_rules;
create policy "Owners can manage availability rules"
on public.availability_rules for all
to authenticated
using (public.is_business_owner(business_id))
with check (public.is_business_owner(business_id));

drop policy if exists "Owners can manage availability exceptions" on public.availability_exceptions;
create policy "Owners can manage availability exceptions"
on public.availability_exceptions for all
to authenticated
using (public.is_business_owner(business_id))
with check (public.is_business_owner(business_id));

drop policy if exists "Owners can manage customers" on public.customers;
create policy "Owners can manage customers"
on public.customers for all
to authenticated
using (public.is_business_owner(business_id))
with check (public.is_business_owner(business_id));

drop policy if exists "Owners can manage appointments" on public.appointments;
create policy "Owners can manage appointments"
on public.appointments for all
to authenticated
using (public.is_business_owner(business_id))
with check (public.is_business_owner(business_id));

drop policy if exists "Owners can manage testimonials" on public.testimonials;
create policy "Owners can manage testimonials"
on public.testimonials for all
to authenticated
using (public.is_business_owner(business_id))
with check (public.is_business_owner(business_id));

drop policy if exists "Owners can manage faqs" on public.faqs;
create policy "Owners can manage faqs"
on public.faqs for all
to authenticated
using (public.is_business_owner(business_id))
with check (public.is_business_owner(business_id));

drop policy if exists "Owners can manage landing sections" on public.landing_sections;
create policy "Owners can manage landing sections"
on public.landing_sections for all
to authenticated
using (public.is_business_owner(business_id))
with check (public.is_business_owner(business_id));

drop policy if exists "Owners can manage business settings" on public.business_settings;
create policy "Owners can manage business settings"
on public.business_settings for all
to authenticated
using (public.is_business_owner(business_id))
with check (public.is_business_owner(business_id));

-- Public booking inserts.
-- Observacao: para criacao anonima de agendamento, o frontend normalmente cria primeiro um customer
-- e depois um appointment. Em producao, prefira uma Edge Function/RPC para validar disponibilidade
-- atomicamente antes de inserir.
drop policy if exists "Public can create customers for active businesses" on public.customers;
create policy "Public can create customers for active businesses"
on public.customers for insert
with check (exists (select 1 from public.businesses b where b.id = business_id and b.status = 'active'));

drop policy if exists "Public can create pending landing appointments" on public.appointments;
create policy "Public can create pending landing appointments"
on public.appointments for insert
with check (
  status = 'pending'
  and source = 'landing_page'
  and exists (select 1 from public.businesses b where b.id = business_id and b.status = 'active')
);

notify pgrst, 'reload schema';

-- =========================
-- Optional seed example
-- =========================
-- Depois de criar um usuario no Supabase Auth, substitua o owner_id abaixo pelo id real.
-- insert into public.businesses (owner_id, name, slug, segment, description, status)
-- values ('00000000-0000-0000-0000-000000000000', 'SorrisoPro', 'sorrisopro', 'odontologia', 'Clinica odontologica premium com agenda inteligente.', 'active');

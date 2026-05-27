-- Execute este arquivo se o schema principal ja foi aplicado
-- e voce quer adicionar/atualizar apenas a captura inicial do onboarding.

create table if not exists public.onboarding_submissions (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  slug text not null,
  segment text,
  contact_name text,
  whatsapp text,
  email text,
  hero_image_url text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint onboarding_submissions_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- Garante a coluna mesmo quando a tabela ja existia antes desta alteracao.
alter table public.onboarding_submissions
add column if not exists hero_image_url text;

-- Preenche a coluna nova para registros antigos que ja tinham a URL dentro do payload.
update public.onboarding_submissions
set hero_image_url = payload #>> '{business_branding,hero_image_url}'
where hero_image_url is null
  and payload #>> '{business_branding,hero_image_url}' is not null
  and payload #>> '{business_branding,hero_image_url}' <> '';

-- Campo usado dentro do payload de onboarding:
-- payload.services[n].image_url
-- A tabela public.services do schema principal ja possui a coluna image_url.

drop trigger if exists set_onboarding_submissions_updated_at on public.onboarding_submissions;

create trigger set_onboarding_submissions_updated_at
before update on public.onboarding_submissions
for each row execute function public.set_updated_at();

create index if not exists onboarding_submissions_slug_idx on public.onboarding_submissions(slug);
create index if not exists onboarding_submissions_status_idx on public.onboarding_submissions(status);

alter table public.onboarding_submissions enable row level security;

drop policy if exists "Public can create onboarding submissions" on public.onboarding_submissions;
drop policy if exists "Public can read onboarding previews" on public.onboarding_submissions;
drop policy if exists "Public can update onboarding submissions" on public.onboarding_submissions;

create policy "Public can create onboarding submissions"
on public.onboarding_submissions for insert
with check (status = 'new');

create policy "Public can read onboarding previews"
on public.onboarding_submissions for select
using (status in ('new', 'preview', 'published'));

-- MVP sem login: permite editar submissões ainda nao publicadas pelo dashboard local.
-- Em producao, trocar por policy authenticated + owner_id.
create policy "Public can update onboarding submissions"
on public.onboarding_submissions for update
using (status in ('new', 'preview'))
with check (status in ('new', 'preview'));

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.onboarding_submissions to anon, authenticated;

notify pgrst, 'reload schema';

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

-- Dono da pagina. Necessario para todas as policies de seguranca.
alter table public.onboarding_submissions
add column if not exists owner_id uuid references auth.users(id) on delete cascade;

create index if not exists onboarding_submissions_owner_id_idx
on public.onboarding_submissions(owner_id);

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

-- CRITICO: slug unico. As policies de appointment_requests,
-- reservation_requests, conversion_requests e landing_testimonials
-- identificam o dono via slug. Sem unicidade, um usuario poderia criar
-- uma pagina com o slug de outra pessoa e acessar dados dos clientes dela.
-- Se este indice falhar por duplicidade em banco existente, execute antes:
-- supabase/migration_2026-06-11_slug_unique_rls_hardening.sql
create unique index if not exists onboarding_submissions_slug_unique
on public.onboarding_submissions (slug);

alter table public.onboarding_submissions enable row level security;

drop policy if exists "Public can create onboarding submissions" on public.onboarding_submissions;
drop policy if exists "Public can read onboarding previews" on public.onboarding_submissions;
drop policy if exists "Public can update onboarding submissions" on public.onboarding_submissions;
drop policy if exists "Anon can read public onboarding previews" on public.onboarding_submissions;
drop policy if exists "Authenticated owners can create onboarding submissions" on public.onboarding_submissions;
drop policy if exists "Authenticated owners can read own onboarding submissions" on public.onboarding_submissions;
drop policy if exists "Authenticated owners can update own onboarding submissions" on public.onboarding_submissions;
drop policy if exists "Authenticated owners can delete own onboarding submissions" on public.onboarding_submissions;

-- A landing publica le a configuracao pelo slug, somente paginas publicaveis.
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

grant usage on schema public to anon, authenticated;
revoke all on public.onboarding_submissions from anon, authenticated;
grant select on public.onboarding_submissions to anon;
grant select, insert, update, delete on public.onboarding_submissions to authenticated;

notify pgrst, 'reload schema';

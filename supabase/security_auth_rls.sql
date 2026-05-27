-- Segurança comercial mínima para o SaaS.
-- Execute depois dos arquivos:
-- - supabase/onboarding_submissions.sql
-- - supabase/appointment_requests.sql
-- - supabase/landing_testimonials.sql
--
-- Depois de executar, /dashboard e /onboarding devem ser usados com Supabase Auth.

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

-- =========================
-- Onboarding submissions
-- =========================

alter table public.onboarding_submissions
add column if not exists owner_id uuid references auth.users(id) on delete cascade;

create index if not exists onboarding_submissions_owner_id_idx
on public.onboarding_submissions(owner_id);

-- Para registros antigos, associe manualmente ao usuário dono:
-- update public.onboarding_submissions
-- set owner_id = 'OWNER_USER_ID_AQUI'::uuid
-- where slug in ('sorriso-real', 'suits');

alter table public.onboarding_submissions enable row level security;

drop policy if exists "Public can create onboarding submissions" on public.onboarding_submissions;
drop policy if exists "Public can read onboarding previews" on public.onboarding_submissions;
drop policy if exists "Public can update onboarding submissions" on public.onboarding_submissions;
drop policy if exists "Authenticated owners can create onboarding submissions" on public.onboarding_submissions;
drop policy if exists "Authenticated owners can read own onboarding submissions" on public.onboarding_submissions;
drop policy if exists "Authenticated owners can update own onboarding submissions" on public.onboarding_submissions;
drop policy if exists "Authenticated owners can delete own onboarding submissions" on public.onboarding_submissions;
drop policy if exists "Anon can read public onboarding previews" on public.onboarding_submissions;

-- A landing publica precisa ler a configuracao pelo slug, mas somente para paginas publicaveis.
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
-- Appointment requests
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

-- View publica sem dados pessoais, usada pela landing para bloquear horarios ocupados.
drop view if exists public.public_appointment_slots;
create view public.public_appointment_slots as
select
  submission_slug,
  appointment_date,
  start_time,
  status
from public.appointment_requests
where status in ('pending', 'confirmed');

revoke all on public.appointment_requests from anon, authenticated;
grant insert on public.appointment_requests to anon;
grant select, update on public.appointment_requests to authenticated;
grant select on public.public_appointment_slots to anon, authenticated;

-- =========================
-- Landing testimonials
-- =========================

alter table public.landing_testimonials enable row level security;

drop policy if exists "Public can read active landing testimonials" on public.landing_testimonials;
drop policy if exists "Dashboard MVP can manage landing testimonials" on public.landing_testimonials;
drop policy if exists "Anon can read active landing testimonials" on public.landing_testimonials;
drop policy if exists "Authenticated owners can manage own landing testimonials" on public.landing_testimonials;

create policy "Anon can read active landing testimonials"
on public.landing_testimonials for select
to anon
using (status = 'active' and authorized = true);

create policy "Authenticated owners can manage own landing testimonials"
on public.landing_testimonials for all
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
  (status <> 'active' or authorized = true)
  and exists (
    select 1
    from public.onboarding_submissions os
    where os.slug = submission_slug
      and os.owner_id = auth.uid()
  )
);

revoke all on public.landing_testimonials from anon, authenticated;
grant select on public.landing_testimonials to anon;
grant select, insert, update, delete on public.landing_testimonials to authenticated;

notify pgrst, 'reload schema';

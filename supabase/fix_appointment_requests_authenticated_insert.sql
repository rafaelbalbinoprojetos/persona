-- Correção: permitir que usuários logados (authenticated) também criem
-- agendamentos em appointment_requests.
--
-- Sintoma: "permission denied for table appointment_requests" ao agendar
-- estando logado (ex.: dono testando a própria página).
-- Causa: a tabela só concedia INSERT para 'anon' e a policy de insert era
-- apenas 'to anon'. Alinha com reservation_requests, que já libera os dois.
--
-- Idempotente: pode rodar mais de uma vez.

drop policy if exists "Anon can create appointment requests" on public.appointment_requests;
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

grant insert on public.appointment_requests to anon, authenticated;

notify pgrst, 'reload schema';

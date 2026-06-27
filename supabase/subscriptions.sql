-- =========================================================================
-- Persona SaaS — Contas, trial e assinatura (Fase A da monetização)
-- =========================================================================
-- Idempotente: pode ser executado várias vezes com segurança.
-- Execute no SQL Editor do Supabase DEPOIS de schema_fixed.sql e
-- onboarding_submissions.sql (precisa de auth.users e da função
-- public.set_updated_at(), além da tabela onboarding_submissions).
--
-- Modelo comercial: trial grátis de 7 dias -> assinatura para manter a
-- página publicada/no ar. Pagamento via Asaas (Pix/boleto/cartão) entra na
-- Fase C; aqui só preparamos a base de dados e as regras de "página no ar".
-- =========================================================================

-- Quantos dias dura o teste grátis. Trocar aqui se quiser outro período.
-- (Usado no default da coluna e no trigger de novos usuários.)

create table if not exists public.accounts (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'trialing',
  trial_ends_at timestamptz not null default (now() + interval '7 days'),
  current_period_end timestamptz,
  provider text,                       -- ex.: 'asaas'
  provider_customer_id text,           -- id do cliente no Asaas
  provider_subscription_id text,       -- id da assinatura no Asaas
  max_pages integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accounts_plan_valid check (plan in ('free', 'pro')),
  constraint accounts_status_valid check (status in ('trialing', 'active', 'past_due', 'canceled')),
  constraint accounts_max_pages_valid check (max_pages >= 1)
);

drop trigger if exists set_accounts_updated_at on public.accounts;
create trigger set_accounts_updated_at
before update on public.accounts
for each row execute function public.set_updated_at();

-- -------------------------------------------------------------------------
-- Criação automática da conta + trial quando o usuário se cadastra
-- -------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.accounts (owner_id, plan, status, trial_ends_at)
  values (new.id, 'free', 'trialing', now() + interval '7 days')
  on conflict (owner_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill: cria conta (com trial) para usuários que já existem e ainda não
-- têm conta. Identificados pelos donos de páginas já criadas.
insert into public.accounts (owner_id, plan, status, trial_ends_at)
select distinct owner_id, 'free', 'trialing', now() + interval '7 days'
from public.onboarding_submissions
where owner_id is not null
on conflict (owner_id) do nothing;

-- -------------------------------------------------------------------------
-- Regras de "no ar"
-- -------------------------------------------------------------------------
-- Conta está ativa (pode manter página no ar) se assinou OU está em trial
-- válido.
create or replace function public.account_is_live(target_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.accounts a
    where a.owner_id = target_owner
      and (
        a.status = 'active'
        or (a.status = 'trialing' and a.trial_ends_at > now())
      )
  );
$$;

-- Versão pública e segura: dado um slug, diz se a página deve aparecer para
-- visitantes. Usa security definer para checar a conta do dono sem expor a
-- tabela accounts ao público. Retorna false quando não há página ou quando a
-- conta não está ativa/em trial.
create or replace function public.page_is_live(target_slug text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select public.account_is_live(os.owner_id)
      from public.onboarding_submissions os
      where os.slug = target_slug
        and os.status in ('preview', 'published')
      order by os.created_at desc
      limit 1
    ),
    false
  );
$$;

grant execute on function public.page_is_live(text) to anon, authenticated;
grant execute on function public.account_is_live(uuid) to authenticated;

-- -------------------------------------------------------------------------
-- Row Level Security
-- -------------------------------------------------------------------------
alter table public.accounts enable row level security;

-- O dono lê apenas a própria conta (para mostrar status/trial no painel).
drop policy if exists "Owners can read own account" on public.accounts;
create policy "Owners can read own account"
on public.accounts for select
to authenticated
using (owner_id = auth.uid());

-- Observação: NÃO há policy de insert/update para clientes. A conta é criada
-- pelo trigger (security definer) e atualizada pelo webhook do Asaas usando a
-- service role key (que ignora RLS). Isso impede que um usuário se conceda
-- assinatura ativa sozinho.

notify pgrst, 'reload schema';

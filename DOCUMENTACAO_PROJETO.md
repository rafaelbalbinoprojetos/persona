# PERSONA — Documentação completa do projeto

Atualizado em: 2026-06-27

Este documento é o retrato atual e detalhado do sistema. Complementa o
`PROJECT_CONTEXT.md` (mais antigo) e registra também as mudanças feitas na
recuperação do banco e na construção da camada de SaaS/monetização.

---

## 1. Visão geral

PERSONA (marca interna: SAAS EPICBYTE) é uma plataforma **SaaS multi-tenant**
de criação de páginas/landing pages premium com **agendamento e captação de
clientes**. O cliente faz um onboarding (manual ou assistido por IA), publica
uma página por `slug` e administra textos, aparência, serviços, galeria,
depoimentos, agenda e reservas.

A mesma landing é **dinâmica** e se adapta ao segmento e ao "modo de
conversão" do negócio. Atende, entre outros: profissionais autônomos,
clínicas/odontologia, estética, consultorias, advocacia, tecnologia, e
espaços para locação/eventos (sítios, pousadas, salões).

Modelo de negócio definido: **SaaS self-service**, com **trial grátis de 7
dias** e depois **assinatura mensal** (R$ 29 — preço de fundador) via **Asaas**
(Pix/boleto/cartão). O "muro" de cobrança é manter a página publicada/no ar.

---

## 2. Stack

Frontend: React 19, Vite 7, Tailwind CSS 3, Framer Motion, Lucide React, ECharts.

Backend/infra: Supabase (Auth, Postgres, Storage, RLS), Vercel (hospedagem +
Serverless Functions + Edge Middleware), OpenAI Responses API (geração por IA),
Asaas (pagamentos/assinatura).

Projeto Supabase atual: `wvgchojyezmsiuimiqau`.

---

## 3. Modelo de arquitetura (importante)

O runtime é **JSON-first**: a maior parte da configuração de cada página vive
na coluna `payload jsonb` da tabela `public.onboarding_submissions`. As páginas
públicas (`/preview/:slug`) leem dessa tabela e montam a landing dinamicamente.

Existe também um **modelo relacional completo** (`businesses`, `services`,
`professionals`, `appointments`, etc.) em `supabase/schema_fixed.sql`, mas ele
NÃO é a base principal do runtime atual — é o modelo "futuro/completo". Há uma
função `publish_onboarding_submission` que copia o payload para esse modelo
relacional, mas o app hoje opera sobre o JSON.

As solicitações dos clientes finais ficam em tabelas próprias por modo:
- `appointment_requests` — agendamento por horário.
- `reservation_requests` — reserva por período (datas).
- `conversion_requests` — solicitação/consultoria/lead.
- `landing_testimonials` — depoimentos.

---

## 4. Estrutura de pastas (principais arquivos)

```
PERSONA/
  index.html                      meta base + Open Graph padrão
  middleware.js                   Edge Middleware (preview de link p/ robôs sociais)
  vercel.json                     rewrites SPA
  api/
    persona-generate.js           geração da página por IA (OpenAI)
    billing/
      checkout.js                 cria cliente + assinatura no Asaas
      webhook.js                  recebe eventos do Asaas e ativa a conta
  src/
    App.jsx                       roteamento por window.location.pathname
    lib/supabaseClient.js         cliente Supabase (VITE_*)
    pages/
      SaaSHome.jsx                home do SaaS
      OnboardingEntry.jsx         decide onboarding x dashboard após login
      OnboardingPage.jsx          criação da página (manual/IA) -> salva submission
      DashboardPage.jsx           gestão/edição das páginas
      PreviewPage.jsx             landing pública + edição inline + SEO + muro de trial
      AgendaManagementPage.jsx    tela de Agenda e reservas (gestão operacional)
      ClientLanding.jsx           (legado)
    persona/
      PersonaOnboarding.jsx       fluxo de IA
      personaPayload.js           normalização da saída da IA
    landing/                      módulos da landing dinâmica
      pageConfig.js               buildPageConfigFromOnboarding (normalizador)
      presets.js                  verticais, presets, defaultEnabledModules
      theme.js
      seo.js                      SEO dinâmico no cliente (applyPageSeo)
      HeaderModule / HeroModule / ServicesModule / ScheduleModule /
      ReservationPeriodModule / ConversionModule / TestimonialsModule /
      FAQModule / GalleryModule / FinalCTAModule / FooterModule / ...
    components/
      auth/AuthGate.jsx
      dashboard/
        ProfessionalManagement.jsx  painel de Agenda e reservas (timeline, gráficos)
        AppearanceEditor / ServicesEditor / GalleryEditor / TestimonialsEditor / ...
      (componentes legados da demo: Hero.jsx, Services.jsx, etc.)
  supabase/                       scripts SQL (ver seção 8)
```

Observação: `src/components/` (raiz) e `src/data/landingData.js` contêm a
**demo legada estática** (a vitrine "PersonaPro"). O produto real é a landing
dinâmica em `src/landing/` + `PreviewPage.jsx`.

---

## 5. Rotas (em `src/App.jsx`, sem React Router)

| Rota | Acesso | Finalidade |
| --- | --- | --- |
| `/` | público | Home do SaaS |
| `/onboarding` | autenticado | Criar a primeira página |
| `/onboarding?new=1` | autenticado | Criar página adicional |
| `/dashboard` | autenticado | Gestão das páginas |
| `/dashboard?slug=...` | autenticado | Editar página específica |
| `/agenda?slug=...` | autenticado | Gestão de agenda e reservas |
| `/preview/:slug` | público | Landing dinâmica (edição inline se for o dono) |
| `/demo/personapro`, `/personapro` | público | Demonstração legada |

`vercel.json` faz rewrite de tudo para `index.html` (SPA).

---

## 6. Modelo de dados (Supabase)

### Tabela central do runtime
`public.onboarding_submissions`
- `id`, `owner_id` (-> auth.users), `business_name`, `slug` (único),
  `segment`, `contact_name`, `whatsapp`, `email`, `hero_image_url`,
  `payload jsonb`, `status`, `created_at`, `updated_at`.
- `status`: `preview` ou `published` (páginas novas nascem em `preview`).
  RLS: anônimo lê apenas `preview`/`published`; o dono lê/edita as próprias.

### Contas / assinatura
`public.accounts` (1 por dono) — criada em `supabase/subscriptions.sql`
- `owner_id` (PK, -> auth.users), `plan` (`free`/`pro`),
  `status` (`trialing`/`active`/`past_due`/`canceled`),
  `trial_ends_at`, `current_period_end`,
  `provider` (`asaas`), `provider_customer_id`, `provider_subscription_id`,
  `max_pages`.
- Criada automaticamente com 7 dias de trial via trigger `handle_new_user`
  em `auth.users`.
- RLS: o dono lê apenas a própria conta. Escrita só via trigger e via
  service role (webhook). Cliente não consegue se dar assinatura.

### Solicitações dos clientes finais
- `public.appointment_requests` — `submission_slug`, `customer_*`,
  `appointment_date`, `start_time`, `status`, `source` (`preview_landing`),
  `payload`. INSERT liberado a `anon` e `authenticated`.
- `public.reservation_requests` — datas (`start_date`/`end_date`), com
  constraint `exclude using gist` que impede sobreposição de períodos
  ativos no mesmo slug.
- `public.conversion_requests` — modos `request`/`consultation`/`lead`.
- `public.landing_testimonials` — depoimentos; só aparecem ao público quando
  `status='active'` e `authorized=true`.

### Modelo relacional (secundário/futuro)
Em `schema_fixed.sql`: `businesses`, `business_branding`, `business_locations`,
`business_media`, `service_categories`, `services`, `professionals`,
`professional_services`, `availability_rules`, `availability_exceptions`,
`customers`, `appointments`, `testimonials`, `faqs`, `landing_sections`,
`business_settings`.

### Funções importantes
- `set_updated_at()` — trigger de updated_at.
- `is_business_owner(uuid)` — checagem de dono (modelo relacional).
- `handle_new_user()` — cria a conta + trial no cadastro.
- `account_is_live(owner)` / `page_is_live(slug)` — dizem se a página deve
  ficar no ar (trial vigente OU assinatura ativa). `page_is_live` é
  security definer e exposta a `anon`/`authenticated`.
- `publish_onboarding_submission(submission_id, owner_id)` — publica o payload
  no modelo relacional (uso opcional).

---

## 7. Fluxos principais

### Onboarding e geração por IA
`OnboardingPage.jsx` + `PersonaOnboarding.jsx` + `api/persona-generate.js`.
A IA (OpenAI, modelo `gpt-4.1-mini` por padrão) recebe um briefing e devolve
JSON (negócio, branding, serviços, FAQ 4–6, editorialHighlight, conversão,
agenda, social, CTA). `personaPayload.js` normaliza. O resultado é salvo em
`onboarding_submissions` com `status='preview'`. Há rate limit (8/10min) e
fallback seguro se a IA falhar.

### Preview público e edição inline
`PreviewPage.jsx` lê a submissão pelo slug, monta a config normalizada
(`buildPageConfigFromOnboarding`) e renderiza os módulos. Se o usuário logado
for o dono (`canEdit`), habilita edição inline (textos, imagens, contatos) e
mostra controles de dono no cabeçalho.

### Muro de publicação (trial/assinatura)
`PreviewPage` chama `page_is_live(slug)`:
- No ar (trial vigente ou assinatura ativa) -> página normal.
- Fora do ar (trial expirado e sem assinatura) -> visitante vê
  "Página temporariamente indisponível"; o dono vê a página com banner
  laranja "Assinar para publicar".
- Durante o trial, o dono vê uma barra roxa "Período de teste: X dias
  restantes — Assinar agora".
- Comportamento "fail-open": se a checagem falhar, a página continua no ar.

### Agendamento / reserva / conversão
A landing insere a solicitação na tabela correta conforme o modo:
- horário -> `appointment_requests` (status `pending`, source `preview_landing`).
- período -> `reservation_requests`.
- request/consultation/lead -> `conversion_requests`.
Requer que a submissão esteja `preview`/`published` (regra de RLS).

### Gestão (Agenda e reservas)
`AgendaManagementPage.jsx` + `components/dashboard/ProfessionalManagement.jsx`.
Painel adaptável por tipo de negócio:
- Reservas por período (sítio/pousada): cards por período, gráfico
  "Reservas por mês" com filtro (clique na barra), botões WhatsApp/Confirmar/
  Concluir/Cancelar.
- Agenda por hora (clínica): **timeline do dia** (grade de horários a partir da
  disponibilidade configurada), mostrando ocupados e **horários livres**,
  com "Ocupação do dia (%)" e os mesmos botões de ação.
Acesso: botão "Agenda" no cabeçalho da página (visível só para o dono) ou pela
engrenagem.

---

## 8. Scripts SQL e ordem de execução

Rodar no SQL Editor do Supabase, nesta ordem:

1. `schema_fixed.sql` — schema base idempotente (substitui o antigo
   `schema.sql`, que dava rollback por trigger duplicado).
2. `onboarding_submissions.sql`
3. `appointment_requests.sql`
4. `reservation_requests.sql`
5. `conversion_requests.sql`
6. `landing_testimonials.sql`
7. `security_auth_rls.sql`
8. `storage_landing_assets.sql`
9. `subscriptions.sql` — contas, trial, `page_is_live` (camada SaaS).
10. `migration_2026-06-11_slug_unique_rls_hardening.sql` — só se algum índice
    de slug único acusar duplicidade.
11. `publish_onboarding_submission.sql` — opcional (publicação relacional).

Patches já incorporados aos arquivos-fonte (mantidos como referência):
- `fix_appointment_requests_authenticated_insert.sql` — liberou INSERT de
  agendamento para `authenticated` (já refletido em `appointment_requests.sql`
  e `security_auth_rls.sql`).

Princípio: todos os scripts são **idempotentes** (usam `drop ... if exists`
antes de `create trigger`/`create policy`, pois o Postgres não aceita
`create trigger/policy if not exists`).

---

## 9. Variáveis de ambiente (Vercel)

Frontend (precisam do prefixo `VITE_` para entrar no build):
- `VITE_SUPABASE_URL` = `https://wvgchojyezmsiuimiqau.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = chave anon (pública)

Servidor / serverless (sem prefixo `VITE_`):
- `PERSONA` = chave da OpenAI (geração por IA). Opcional: `PERSONA_MODEL`.
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` — usadas para validar login nas
  funções; caem em `VITE_*` se ausentes.
- `SUPABASE_SERVICE_ROLE_KEY` = service role (SECRETA) — usada por
  `checkout.js` e `webhook.js` para gravar em `accounts` ignorando RLS.
- `ASAAS_API_KEY` = chave do Asaas (sandbox para testes / produção depois).
- `ASAAS_BASE_URL` = `https://api-sandbox.asaas.com/v3` (sandbox) ou
  `https://api.asaas.com/v3` (produção). Plano B sandbox antigo:
  `https://sandbox.asaas.com/api/v3`.
- `ASAAS_WEBHOOK_TOKEN` = segredo compartilhado com o webhook do Asaas.
- Opcional: `ASAAS_PLAN_VALUE` (valor mensal; padrão 29).

Importante: variáveis `VITE_*` vão para o navegador (não colocar segredos
com esse prefixo). A `SUPABASE_SERVICE_ROLE_KEY` nunca deve ter prefixo `VITE_`.
Após mudar variáveis na Vercel, é preciso **redeploy** (Vite injeta no build).

---

## 10. Monetização (Asaas) — detalhe

Fluxo:
1. Dono clica em "Assinar" (banner de trial expirado ou barra "Assinar agora").
2. `SubscribeModal` coleta CPF/CNPJ e chama `POST /api/billing/checkout`
   (com JWT do Supabase).
3. `checkout.js` cria/recupera o cliente no Asaas, cria a assinatura mensal
   (`billingType: UNDEFINED`, ciclo mensal, R$ 29) e devolve o link de
   pagamento (`invoiceUrl`). Salva `provider_customer_id`/`provider_subscription_id`.
4. Cliente paga (Pix/boleto/cartão).
5. Asaas chama `POST /api/billing/webhook` (validado pelo `ASAAS_WEBHOOK_TOKEN`).
   Eventos de pagamento confirmado/recebido -> conta vira `active`/`pro`,
   `current_period_end` +1 mês; vencido -> `past_due`; cancelado/estornado ->
   `canceled`/`free`.

Webhook no painel do Asaas: URL `https://SEU-DOMINIO/api/billing/webhook`,
token igual ao `ASAAS_WEBHOOK_TOKEN`, versão da API `v3`, eventos
`PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE` (e opcionalmente
`PAYMENT_DELETED`, `PAYMENT_REFUNDED`).

Observação: assinatura por Pix/boleto não renova sozinha (cliente paga a cada
ciclo); só cartão renova automático. Pix como método dedicado no checkout
exige conta de produção aprovada (prova de vida) + chave Pix cadastrada.

---

## 11. SEO e compartilhamento

Três camadas:
1. `index.html` — meta/title e Open Graph padrão (com acentuação correta).
2. `src/landing/seo.js` — `applyPageSeo` / `buildSeoFromConfig`, chamado no
   `PreviewPage` por `useEffect`; ajusta título/description/OG/canonical por
   página (humanos + Google, que renderiza JS).
3. `middleware.js` — Edge Middleware na Vercel. Detecta robôs sociais
   (WhatsApp/Facebook/LinkedIn etc.) em `/preview/:slug`, busca a submissão no
   Supabase e devolve HTML com as meta tags certas (incluindo `og:image` da
   hero + `og:image:width/height`). Humanos seguem para o SPA normalmente
   (pass-through). Só roda em deploy na Vercel, não no `vite dev`.

---

## 12. Histórico desta sessão (2026-06)

- Recuperação do banco: identificado que `schema.sql` não rodava por trigger
  duplicado de `onboarding_submissions`; criado `schema_fixed.sql` idempotente
  e corrigido `landing_testimonials.sql` (trigger sem `drop if exists`).
- Reconexão Vercel↔Supabase: corrigido erro de `VITE_SUPABASE_URL` inválida
  (faltava `https://`/redeploy).
- Qualidade da página gerada: FAQ e depoimentos ligados por padrão (e correção
  do bug que escondia depoimentos reais do público); prompt da IA enriquecido.
- SEO por página + preview de link no WhatsApp.
- Monetização: tabela `accounts` + trial; muro de publicação no app; integração
  Asaas (checkout + webhook + modal de assinatura); barra "Assinar agora".
- Painel de Agenda/Reservas: botão WhatsApp (1 clique), botão Concluir, layout
  adaptável, telefone formatado, gráfico "Reservas por mês" com filtro,
  timeline do dia por hora com ocupação, contraste/visual dos cards.
- Correções: INSERT de agendamento para `authenticated`; páginas novas nascem
  `preview`; atalho "Agenda" no cabeçalho para o dono.

---

## 13. Pendências e próximos passos

Para cobrar de verdade (produção):
1. Concluir a **prova de vida** no Asaas.
2. **Cadastrar a chave Pix** (libera Pix nativo no checkout).
3. **Cutover para produção**: trocar `ASAAS_API_KEY` e `ASAAS_BASE_URL` para
   produção, recriar o webhook apontando para produção e refazer um teste.

Refinamentos opcionais:
- Controle de **Publicar/Despublicar** no painel.
- **Tira de semana** na agenda da clínica (navegação com carga por dia).
- **Colunas por profissional** (clínicas com vários profissionais).
- **Imagem de capa padrão** da marca (fallback de `og:image`).
- **Otimização de imagem** para o preview (fotos pesadas no WhatsApp).
- Limpeza: remover função morta `mapPersonaToSupabasePayload` em
  `personaPayload.js`.
- Reset da conta de teste do dono (ficou `active/pro` por causa do sandbox).

---

## 14. Dicas operacionais

- SQL sempre idempotente; rodar na ordem da seção 8.
- Página só fica pública/agendável com `status` em `preview`/`published`
  E conta em trial vigente ou assinatura ativa.
- Forçar trial expirado para testes:
  `update public.accounts set trial_ends_at = now() - interval '1 day' where owner_id = '<uuid>';`
- Reverter:
  `update public.accounts set status='trialing', plan='free', trial_ends_at = now() + interval '7 days' where owner_id = '<uuid>';`
- Depois de mexer em env vars na Vercel: redeploy.
- `middleware.js` só funciona em deploy (Vercel), não local.

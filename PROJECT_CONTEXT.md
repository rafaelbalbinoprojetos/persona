# SAAS EPICBYTE - Contexto Completo do Projeto

Atualizado em: 2026-06-02

## 1. Como usar este arquivo

Este documento e o ponto de partida para qualquer nova sessao de desenvolvimento.
Antes de reler o repositorio inteiro:

1. Ler este arquivo.
2. Executar `git status --short`.
3. Conferir apenas os arquivos relacionados a tarefa atual.
4. Atualizar este documento ao concluir mudancas estruturais, novas tabelas SQL ou novos fluxos.

O codigo continua sendo a fonte definitiva. Este arquivo registra a arquitetura e o estado funcional atual para reduzir o custo de retomada.

## 2. Resumo executivo

O projeto e uma plataforma SaaS multi-tenant para criacao de paginas premium configuraveis. O cliente faz onboarding manual ou assistido por IA, publica uma landing page e administra sua pagina, aparencia, servicos, galeria, depoimentos e regras de atendimento.

A plataforma atende mais de um tipo de negocio:

- profissionais autonomos;
- consultorias;
- escritorios;
- clinicas e dentistas;
- estetica e bem-estar;
- tecnologia;
- marcas pessoais;
- sitios, chacaras, pousadas, hoteis e espacos para eventos;
- negocios que trabalham com reserva de datas ou solicitacoes comerciais.

A mesma landing dinamica muda textos, modulos, tema e formulario de conversao conforme o segmento e o modo de conversao configurado.

O produto esta evoluindo de uma landing limpa para um website builder assistido por IA com:

- visual editorial premium;
- edicao contextual inline;
- fallbacks visuais elegantes;
- ocultacao inteligente de campos ausentes para visitantes;
- acoes discretas para o dono completar a pagina;
- calendario por horarios ou por periodo de datas;
- gestao separada de agenda e reservas.

## 3. Estado atual do produto

Funcionalidades implementadas:

- autenticacao com Supabase;
- login por senha, cadastro e magic link;
- onboarding manual;
- onboarding assistido por IA;
- suporte a multiplas paginas por usuario;
- redirecionamento automatico para dashboard quando o usuario ja possui pagina;
- criacao de nova pagina em `/onboarding?new=1`;
- listagem, abertura e exclusao de paginas;
- exclusao das imagens do Storage ao excluir uma pagina inteira;
- preview publico por slug;
- edicao inline de textos da landing;
- upload, substituicao e exclusao de imagens;
- exclusao da imagem anterior ao substituir uma imagem;
- upload de imagens de servicos;
- criacao e exclusao inline de servicos;
- upload e exclusao inline de imagens da galeria;
- empty state editavel da galeria para o dono;
- confirmacao antes de excluir cards;
- painel de temas;
- painel de aparencia com rolagem em dispositivos moveis;
- botao de acesso a agenda e reservas como primeiro item da engrenagem;
- botao de logout no cabecalho da pagina do dono;
- tema `dark-editorial`;
- hero cinematografica;
- estatisticas de confianca;
- secao editorial clara para contraste;
- secao de assinatura/experiencia;
- depoimentos premium;
- FAQ refinado;
- CTA final;
- footer refinado;
- calendario tradicional com dia e horario;
- calendario de reservas por periodo de datas;
- gestao operacional separada em `/agenda`;
- contadores de agenda incluindo reservas por periodo;
- fallbacks premium para imagens ausentes;
- contatos ausentes ocultos para visitante e editaveis inline para dono.

## 4. Stack

Frontend:

- React 19;
- Vite 7;
- Tailwind CSS 3;
- Framer Motion;
- Lucide React;
- ECharts.

Backend e infraestrutura:

- Supabase Auth;
- Supabase Postgres;
- Supabase Storage;
- Supabase Row Level Security;
- Vercel;
- Vercel Serverless Function para geracao por IA;
- OpenAI Responses API.

Dependencias principais em `package.json`:

```json
{
  "@supabase/supabase-js": "^2.106.2",
  "@vitejs/plugin-react": "^5.0.4",
  "echarts": "^6.1.0",
  "framer-motion": "^12.40.0",
  "lucide-react": "^0.468.0",
  "react": "^19.1.1",
  "react-dom": "^19.1.1",
  "vite": "^7.1.0"
}
```

Scripts:

```powershell
npm run dev
npm run build
npm run preview
```

## 5. Estrutura principal

```text
SAAS EPICBYTE/
  api/
    persona-generate.js
  src/
    App.jsx
    main.jsx
    index.css
    lib/
      supabaseClient.js
    pages/
      SaaSHome.jsx
      OnboardingEntry.jsx
      OnboardingPage.jsx
      DashboardPage.jsx
      PreviewPage.jsx
      AgendaManagementPage.jsx
      ClientLanding.jsx
    persona/
      PersonaOnboarding.jsx
      personaPayload.js
    landing/
      pageConfig.js
      presets.js
      theme.js
      modules.jsx
      EditablePrimitives.jsx
      HeaderModule.jsx
      ThemeSettingsPanel.jsx
      HeroModule.jsx
      TrustStatsModule.jsx
      ServicesModule.jsx
      SignatureModule.jsx
      EditorialHighlightModule.jsx
      GalleryModule.jsx
      ConversionModule.jsx
      ScheduleModule.jsx
      ReservationPeriodModule.jsx
      TestimonialsModule.jsx
      FAQModule.jsx
      FinalCTAModule.jsx
      FooterModule.jsx
      landingUtils.js
      imageUtils.js
      dateUtils.js
    components/
      auth/
        AuthGate.jsx
      dashboard/
        AppearanceEditor.jsx
        ServicesEditor.jsx
        GalleryEditor.jsx
        TestimonialsEditor.jsx
        AgendaEditor.jsx
        ProfessionalManagement.jsx
        Overview.jsx
  supabase/
    schema.sql
    onboarding_submissions.sql
    security_auth_rls.sql
    appointment_requests.sql
    conversion_requests.sql
    reservation_requests.sql
    landing_testimonials.sql
    storage_landing_assets.sql
    publish_onboarding_submission.sql
  deploy-github.ps1
  vercel.json
  vite.config.js
```

Observacao: `src/components/` ainda contem componentes legados da landing demonstrativa. Para evoluir a pagina dinamica multi-tenant, priorizar `src/landing/` e `src/pages/PreviewPage.jsx`.

## 6. Rotas

As rotas sao controladas manualmente em `src/App.jsx` usando `window.location.pathname`. O projeto ainda nao usa React Router.

| Rota | Acesso | Finalidade |
| --- | --- | --- |
| `/` | publico | Pagina inicial do SaaS |
| `/onboarding` | autenticado | Criacao da primeira pagina |
| `/onboarding?new=1` | autenticado | Criacao forcada de uma nova pagina |
| `/dashboard` | autenticado | Gestao das paginas do usuario |
| `/dashboard?slug=...` | autenticado | Editar pagina selecionada |
| `/dashboard?slug=...&tab=testimonials` | autenticado | Abrir editor de depoimentos |
| `/agenda` | autenticado | Gestao operacional de agenda e reservas |
| `/agenda?slug=...` | autenticado | Gestao de uma pagina especifica |
| `/preview/:slug` | publico | Landing dinamica publica com edicao inline quando o visitante e dono |
| `/demo/personapro` | publico | Demonstracao legada |
| `/personapro` | publico | Alias da demonstracao |

O `vercel.json` aplica rewrite para `index.html`, preservando o funcionamento SPA no deploy.

## 7. Autenticacao

Arquivo principal: `src/components/auth/AuthGate.jsx`.

Fluxos disponiveis:

- login com email e senha;
- criacao de conta;
- magic link;
- leitura da sessao atual;
- atualizacao por `onAuthStateChange`;
- protecao das paginas de onboarding, dashboard e agenda.

Variaveis frontend:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Arquivo cliente: `src/lib/supabaseClient.js`.

Se as variaveis estiverem ausentes ou forem placeholders, `isSupabaseConfigured` sera falso e a interface informa que falta configuracao.

## 8. Fluxo de entrada apos login

Arquivo: `src/pages/OnboardingEntry.jsx`.

Regra:

1. Se a URL tiver `?new=1`, exibir onboarding para criar outra pagina.
2. Caso contrario, consultar paginas do usuario em `onboarding_submissions`.
3. Se o usuario ja tiver pagina, redirecionar para `/dashboard`.
4. Se nao tiver, abrir o onboarding inicial.

Isso evita enviar usuarios existentes novamente para a criacao assistida por IA.

## 9. Modelo de dados atual: JSON-first

Ponto critico: o runtime atual usa principalmente a tabela:

```sql
public.onboarding_submissions
```

A maior parte da configuracao fica em:

```sql
payload jsonb
```

O modelo relacional completo existe em `supabase/schema.sql`, mas nao e a base principal da landing dinamica atual.

Nao migrar silenciosamente o runtime para o schema relacional. Uma migracao futura precisa ser deliberada e testada.

Colunas relevantes em `onboarding_submissions`:

```text
id
owner_id
business_name
slug
segment
contact_name
whatsapp
email
hero_image_url
payload
status
created_at
updated_at
```

Status esperados:

- `preview`;
- `published`.

## 10. Estrutura esperada do payload

O payload pode conter:

```js
{
  businesses: {
    name,
    slug,
    segment,
    whatsapp,
    email,
    instagram_url,
    tiktok_url,
    linkedin_url,
    facebook_url,
    youtube_url,
    website_url,
    status
  },
  business_branding: {
    primary_color,
    theme_key,
    hero_title,
    hero_subtitle,
    hero_image_url,
    hero_badge,
    cta_primary_text,
    cta_secondary_text
  },
  business_locations: {
    name,
    address,
    is_main
  },
  services: [],
  trustStats: [],
  editorialHighlight: {},
  professionals: [],
  availability_rules: [],
  availability_breaks: [],
  availability_date_blocks: [],
  conversion: {},
  faqs: [],
  finalCta: {},
  socials: {},
  gallery: [],
  enabledModules: {}
}
```

O normalizador `src/landing/pageConfig.js` aceita variantes camelCase e snake_case em diversos campos para preservar compatibilidade.

## 11. Normalizacao da landing

Arquivo principal: `src/landing/pageConfig.js`.

Funcao principal:

```js
buildPageConfigFromOnboarding(submission, selectedThemeKey)
```

Responsabilidades:

- ler colunas da tabela e `payload`;
- detectar vertical do negocio;
- escolher preset;
- normalizar tema;
- aplicar fallbacks;
- normalizar modulos ativos;
- normalizar servicos;
- normalizar estatisticas;
- normalizar destaque editorial;
- normalizar profissionais;
- normalizar depoimentos;
- normalizar FAQ;
- normalizar galeria;
- normalizar agenda;
- normalizar CTA final;
- normalizar conversao.

O resultado usado pelos modulos contem:

```js
{
  submission,
  vertical,
  preset,
  theme,
  enabledModules,
  business,
  branding,
  location,
  services,
  trustStats,
  editorialHighlight,
  professionals,
  testimonials,
  faqs,
  gallery,
  availability,
  availabilityBreaks,
  availabilityDateBlocks,
  finalCta,
  conversion
}
```

## 12. Verticais e presets

Arquivo: `src/landing/presets.js`.

Verticais reconhecidas:

- `dental`;
- `legal`;
- `aesthetic`;
- `medical`;
- `consulting`;
- `fitness`;
- `realEstate`;
- `venue`;
- `wellness`;
- `technology`.

Termos como sitio, chacara, fazenda, temporada, hospedagem, pousada, aluguel, reserva, evento, festa e salao direcionam para `venue`.

Preset `venue`:

- secao de servicos vira opcoes de reserva;
- CTA usa reserva de data;
- textos deixam de tratar o negocio como profissional;
- calendario pode operar por intervalo de datas;
- FAQ usa linguagem adequada a hospedagem ou evento.

## 13. Modos de conversao

Modos suportados:

```text
appointment
request
consultation
lead
```

Modos de calendario:

```text
time_slots
date_range
```

Regras:

- `appointment + time_slots`: agenda tradicional por dia e horario;
- `appointment + date_range`: reserva por data inicial e data final;
- `consultation`: formulario de consulta, podendo usar agenda;
- `request`: solicitacao comercial;
- `lead`: captura de contato.

Para `venue`, o fallback padrao e reserva por periodo quando fizer sentido.

## 14. Preview publico e modo de edicao

Arquivo principal: `src/pages/PreviewPage.jsx`.

Fluxo:

1. Ler slug em `/preview/:slug`.
2. Consultar a submissao mais recente pelo slug.
3. Construir configuracao normalizada.
4. Consultar sessao Supabase.
5. Comparar `submission.owner_id` com o usuario logado.
6. Se for dono, habilitar edicao inline.
7. Se for visitante, renderizar apenas o conteudo publico limpo.

Regra central:

- visitante nunca deve perceber que faltam dados;
- dono deve enxergar acoes contextuais discretas para completar o conteudo.

Edicoes inline ja implementadas:

- nome principal;
- especialidade;
- bio;
- titulo e subtitulo da hero;
- nome e descricao de servico;
- titulo e descricao de item da galeria;
- textos do CTA final;
- WhatsApp;
- email;
- endereco;
- Instagram.

Alguns campos de contato ainda usam `window.prompt`. Evoluir depois para modal leve ou painel contextual.

## 15. Componentes de edicao contextual

Arquivo: `src/landing/EditablePrimitives.jsx`.

### EditableSlot

Comportamento:

- conteudo presente: renderiza normalmente;
- conteudo ausente e usuario dono: renderiza acao premium;
- conteudo ausente e visitante: retorna `null`.

### SafeImage

Comportamento:

- imagem valida: renderiza imagem;
- imagem quebrada: usa fallback premium;
- galeria sem imagem para visitante: oculta;
- imagem ausente para dono: permite adicionar ou trocar imagem.

### SmartContactList

Comportamento:

- visitante ve apenas contatos preenchidos;
- se nao houver contatos, visitante nao ve bloco vazio;
- dono ve contatos existentes e acoes inline para completar WhatsApp, email e endereco.

### SmartSocialLinks

Comportamento:

- visitante ve apenas redes preenchidas;
- visitante nao ve area social vazia;
- dono recebe acao para adicionar rede.

Limitacao atual: a acao inline de rede social esta orientada principalmente para Instagram.

## 16. Modulos da landing dinamica

### HeaderModule

Arquivo: `src/landing/HeaderModule.jsx`.

- cabecalho fixo;
- menu dinamico;
- CTA principal;
- engrenagem para o dono;
- logout para o dono.

### ThemeSettingsPanel

Arquivo: `src/landing/ThemeSettingsPanel.jsx`.

- painel de temas;
- rolagem mobile;
- primeiro item: `Gerenciar agenda e reservas`;
- link para editar cadastro no dashboard.

### HeroModule

Arquivo: `src/landing/HeroModule.jsx`.

- hero dinamica;
- imagem com overlay;
- fallback cinematografico sem imagem;
- CTA primario e secundario;
- floating cards;
- edicao inline;
- upload e substituicao da imagem principal;
- variacao especial para `dark-editorial`;
- parallax e breathing sutis.

### TrustStatsModule

Arquivo: `src/landing/TrustStatsModule.jsx`.

- estatisticas de confianca;
- ate quatro itens;
- layout horizontal premium no tema editorial;
- nao inventa numeros quando a IA nao recebeu dados objetivos.

### ServicesModule

Arquivo: `src/landing/ServicesModule.jsx`.

- servicos ou opcoes de reserva;
- cards editoriais;
- fallback premium sem imagem;
- edicao inline de texto;
- upload, troca e exclusao da imagem;
- criacao inline de novo servico;
- exclusao com confirmacao;
- exclusao da imagem associada ao excluir o card.

### SignatureModule

Arquivo: `src/landing/SignatureModule.jsx`.

- storytelling;
- beneficios conforme segmento;
- evita repeticao excessiva de cards;
- para espacos: conforto, privacidade e facilidade de reserva.

### EditorialHighlightModule

Arquivo: `src/landing/EditorialHighlightModule.jsx`.

- secao clara para contraste;
- imagem, texto e beneficios;
- ajuda a criar ritmo entre secoes escuras;
- usa dados da IA ou fallback.

### GalleryModule

Arquivo: `src/landing/GalleryModule.jsx`.

- visitante nao ve galeria vazia;
- dono ve slots em branco editaveis;
- upload direto no local;
- edicao de titulo e descricao;
- exclusao de imagem.

### ConversionModule

Arquivo: `src/landing/ConversionModule.jsx`.

Escolhe entre:

- `ScheduleModule`;
- `ReservationPeriodModule`;
- formulario de consulta;
- formulario de solicitacao;
- formulario de lead.

### ScheduleModule

Arquivo: `src/landing/ScheduleModule.jsx`.

- calendario por dia;
- horarios disponiveis;
- pausas;
- bloqueios;
- consulta horarios ocupados;
- insercao em `appointment_requests`;
- contatos inteligentes.

### ReservationPeriodModule

Arquivo: `src/landing/ReservationPeriodModule.jsx`.

- data inicial;
- data final;
- verificacao de sobreposicao;
- consulta periodos reservados;
- insercao em `reservation_requests`;
- adequado a sitio, hotel, pousada e eventos.

### TestimonialsModule

Arquivo: `src/landing/TestimonialsModule.jsx`.

- depoimentos ativos;
- cards premium;
- visitante nao ve secao vazia;
- dono ve empty state para adicionar primeiro depoimento.

### FAQModule

Arquivo: `src/landing/FAQModule.jsx`.

- accordion;
- layout editorial;
- fallback por segmento;
- ocultacao inteligente quando necessario.

### FinalCTAModule

Arquivo: `src/landing/FinalCTAModule.jsx`.

- CTA final premium;
- texto dinamico;
- imagem opcional;
- CTA WhatsApp opcional;
- sem imagem: visitante recebe composicao centralizada;
- sem imagem: dono recebe acao para adicionar.

Limitacao atual: o upload da foto do CTA reaproveita a imagem da hero. Separar em campo proprio futuramente.

### FooterModule

Arquivo: `src/landing/FooterModule.jsx`.

- links filtrados conforme secoes ativas;
- contatos preenchidos;
- redes preenchidas;
- sem textos de campo ausente para visitante;
- frase institucional: `Design, presenca e experiencia em uma unica plataforma.`

## 17. Tema Dark Editorial

Arquivo: `src/landing/theme.js`.

Tema implementado:

```js
{
  key: "dark-editorial",
  name: "Dark Editorial",
  background: "#05070D",
  surface: "#0B1020",
  surfaceAlt: "#111827",
  surfaceGlass: "rgba(255,255,255,0.06)",
  text: "#F8FAFC",
  textSoft: "#CBD5E1",
  textMuted: "#94A3B8",
  primary: "#8B5CF6",
  secondary: "#A78BFA",
  accent: "#F4D58D",
  border: "rgba(255,255,255,0.12)",
  glow: "rgba(139,92,246,0.35)"
}
```

Outros temas disponiveis:

- `clean-blue`;
- `warm-minimal`;
- `soft-lilac`;
- `dark-slate`;
- `dark-violet`;
- `dark-emerald`;
- `minimal-white`;
- `dark-luxury`;
- `editorial-black`;
- `soft-medical`;
- `gold-prestige`;
- `neo-corporate`;
- `creator-mode`;
- `executive-black`.

O tema selecionado no preview pode ficar salvo localmente:

```text
preview-theme:${slug}
```

Atencao: uma troca feita somente no painel de preview pode divergir do tema persistido no payload ate o salvamento pelo dashboard.

## 18. Dashboard

Arquivo principal: `src/pages/DashboardPage.jsx`.

Responsabilidades:

- listar paginas do usuario;
- selecionar pagina;
- criar nova pagina;
- abrir preview;
- excluir pagina;
- excluir imagens da pagina no Storage;
- editar configuracao;
- salvar payload preservando campos desconhecidos.

Abas:

```text
overview
appearance
services
gallery
testimonials
agenda
```

A aba `agenda` do dashboard configura regras. A gestao operacional de solicitacoes fica em `/agenda`.

Editores:

- `AppearanceEditor.jsx`;
- `ServicesEditor.jsx`;
- `GalleryEditor.jsx`;
- `TestimonialsEditor.jsx`;
- `AgendaEditor.jsx`.

Ao salvar, preservar `...payload` antes de sobrescrever campos conhecidos. Isso evita perder dados futuros ainda nao expostos em um editor.

## 19. Gestao de agenda e reservas

Pagina: `src/pages/AgendaManagementPage.jsx`.

Acesso:

```text
/agenda
/agenda?slug=pagina
```

O acesso tambem aparece como primeiro item da engrenagem no preview.

Funcionalidades:

- selecionar pagina;
- ler agendamentos por horario;
- ler reservas por periodo;
- confirmar;
- cancelar;
- exibir metricas;
- renderizar painel operacional.

Componente principal:

```text
src/components/dashboard/ProfessionalManagement.jsx
```

Metricas principais consideram conjuntamente:

- `appointment_requests`;
- `reservation_requests`.

Isso corrige o problema em que uma reserva confirmada por periodo nao aparecia nos contadores.

Limitacao: alguns graficos detalhados ainda sao orientados principalmente aos agendamentos por horario.

## 20. Supabase Storage

Bucket:

```text
landing-assets
```

SQL:

```text
supabase/storage_landing_assets.sql
```

Configuracao:

- bucket publico;
- limite de 5 MB por imagem;
- JPEG;
- PNG;
- WebP;
- GIF;
- escrita autenticada;
- pasta principal obrigatoriamente igual ao UID do usuario.

Formato de caminho:

```text
${userId}/${slug}/${prefix}-${Date.now()}.${extension}
```

Comportamentos implementados:

- ao substituir hero, excluir hero anterior;
- ao substituir imagem de servico, excluir anterior;
- ao excluir servico, excluir imagem associada;
- ao excluir imagem da galeria, excluir arquivo;
- ao excluir pagina, excluir arquivos conhecidos e pasta `${userId}/${slug}`;
- nunca excluir arquivo fora da pasta do usuario atual.

## 21. SQLs Supabase

Arquivos:

| Arquivo | Finalidade |
| --- | --- |
| `supabase/schema.sql` | Schema relacional completo e funcao `set_updated_at` |
| `supabase/onboarding_submissions.sql` | Tabela JSON-first do onboarding |
| `supabase/security_auth_rls.sql` | `owner_id` e politicas comerciais principais |
| `supabase/appointment_requests.sql` | Solicitacoes por horario e view publica |
| `supabase/conversion_requests.sql` | Leads, consultas e solicitacoes |
| `supabase/reservation_requests.sql` | Reservas por intervalo de datas |
| `supabase/landing_testimonials.sql` | Depoimentos da landing |
| `supabase/storage_landing_assets.sql` | Bucket e politicas de Storage |
| `supabase/publish_onboarding_submission.sql` | Publicacao opcional para modelo relacional |
| `supabase/migration_2026-06-11_slug_unique_rls_hardening.sql` | Migracao: deduplica slugs, cria indice unico de slug e consolida RLS endurecido (executar em banco existente) |

Ordem recomendada para ambiente novo:

1. `supabase/schema.sql`
2. `supabase/onboarding_submissions.sql`
3. `supabase/appointment_requests.sql`
4. `supabase/landing_testimonials.sql`
5. `supabase/security_auth_rls.sql`
6. `supabase/conversion_requests.sql`
7. `supabase/reservation_requests.sql`
8. `supabase/storage_landing_assets.sql`

Motivo da ordem:

- `onboarding_submissions.sql` usa trigger de `set_updated_at`;
- `security_auth_rls.sql` adiciona `owner_id`;
- `conversion_requests.sql` e `reservation_requests.sql` usam `owner_id`.

Em banco ja existente, revisar manualmente linhas antigas sem `owner_id`.

## 22. Modelo relacional futuro

`supabase/schema.sql` contem uma arquitetura mais ampla:

- businesses;
- business_branding;
- business_locations;
- business_media;
- service_categories;
- services;
- professionals;
- professional_services;
- availability_rules;
- availability_exceptions;
- customers;
- appointments;
- testimonials;
- faqs;
- landing_sections;
- business_settings;
- onboarding_submissions.

Esse schema permite evolucao futura, mas o preview e dashboard atuais operam principalmente com JSON em `onboarding_submissions.payload`.

O arquivo `publish_onboarding_submission.sql` existe para transformar onboarding em registros relacionais quando essa migracao for adotada.

## 23. Reservas por periodo

Tabela:

```text
public.reservation_requests
```

View publica:

```text
public.public_reservation_ranges
```

Regras:

- reserva possui data inicial e final;
- reservas `pending` ou `confirmed` impedem sobreposicao;
- canceladas deixam de bloquear o intervalo;
- o frontend tambem valida bloqueios manuais e dias permitidos.

Atencao importante:

Atualmente o intervalo considera a data final de forma inclusiva. Isso funciona para sitio e eventos, mas pode ser inadequado para hotelaria tradicional, onde checkout e check-in no mesmo dia devem ser permitidos. Para hotelaria, avaliar trocar a semantica para intervalo `[)` e ajustar UI e SQL conjuntamente.

## 24. Geracao assistida por IA

API serverless:

```text
api/persona-generate.js
```

Variaveis Vercel:

```env
PERSONA=
PERSONA_MODEL=gpt-4.1-mini
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

`PERSONA_MODEL` e opcional. `SUPABASE_URL` e `SUPABASE_ANON_KEY` sao
obrigatorias para a validacao de login (a funcao tambem aceita
`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` como fallback, que ja
existem no projeto Vercel para o build do frontend).

A funcao:

- aceita POST;
- exige usuario logado: valida o JWT Supabase via `GET /auth/v1/user` (401 sem token valido);
- aplica rate limit em memoria por usuario: 8 chamadas a cada 10 minutos (429 ao exceder);
- limita texto do prompt;
- chama OpenAI Responses API;
- exige JSON;
- normaliza fallback quando necessario.

O frontend (`PersonaOnboarding.jsx`) envia `Authorization: Bearer <access_token>`
da sessao Supabase e trata 401/429 com mensagem amigavel.

Limitacao do rate limit: e por instancia serverless (instancia fria zera
o contador). Para teto global rigido, migrar para Upstash Redis ou Vercel KV.

O prompt foi adaptado para interpretar:

- profissional individual;
- empresa;
- equipe;
- clinica;
- consultoria;
- negocio de tecnologia;
- espaco para eventos;
- sitio;
- chacara;
- pousada;
- hotel;
- experiencia reservavel;
- servico ou produto.

Regra importante: nao forcar linguagem de profissional premium quando o cliente descreve um espaco para aluguel.

Para reservas de local:

- oferecer opcoes de reserva;
- usar linguagem de datas;
- usar `calendarMode: "date_range"` quando apropriado;
- evitar texto de consulta medica;
- evitar inventar estatisticas.

Normalizacao frontend:

```text
src/persona/personaPayload.js
```

## 25. Deploy

Script:

```text
deploy-github.ps1
```

Uso:

```powershell
.\deploy-github.ps1 -Message "Descricao objetiva"
```

Opcional:

```powershell
.\deploy-github.ps1 -Message "Descricao objetiva" -SkipBuild
```

O script:

1. valida Git e npm;
2. identifica repositorio e branch;
3. executa build, salvo `-SkipBuild`;
4. executa `git add .`;
5. cria commit;
6. envia a branch para `origin`.

Antes de executar, conferir `git status --short`, pois o script inclui todas as alteracoes.

## 26. Ambiente local

Criar `.env` local sem versionar:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON
```

Executar:

```powershell
npm install
npm run dev
```

Build:

```powershell
npm run build
```

Ultimo estado conhecido:

- builds anteriores passaram;
- Vite informou warning de chunk JavaScript grande;
- nao ha suite automatizada configurada;
- Playwright nao esta instalado no projeto.

## 27. Decisoes de produto importantes

### Visitante nunca ve ausencia

Nao renderizar publicamente:

- `Imagem indisponivel`;
- `Nao informado`;
- `Sem imagem`;
- `undefined`;
- `null`;
- cards vazios;
- linhas de contato vazias;
- areas grandes sem conteudo.

### Dono ve acoes contextuais

Exemplos:

- adicionar WhatsApp;
- adicionar email;
- adicionar endereco;
- adicionar imagem principal;
- adicionar imagem do servico;
- adicionar galeria;
- adicionar depoimento;
- adicionar FAQ;
- adicionar rede social;
- adicionar foto ao CTA.

Essas acoes devem reaproveitar a landing como CMS visual e evitar jogar o usuario de volta ao onboarding.

### Nao duplicar paginas

Variantes visuais devem ser criadas por:

- tema;
- props;
- configuracao;
- segmentacao;
- modo de conversao.

Evitar paginas estaticas separadas por nicho.

### Preservar compatibilidade

Novos campos devem:

- aceitar dados antigos;
- possuir fallback;
- preservar payload desconhecido;
- nao quebrar onboarding;
- nao quebrar Supabase;
- respeitar RLS;
- funcionar mobile.

## 28. Riscos e melhorias pendentes

Resolvido em 2026-06-11:

- Slug agora e unico (`onboarding_submissions_slug_unique`). Antes, as policies baseadas em `slug + owner_id` permitiam que um usuario autenticado criasse pagina com slug de terceiro e lesse/alterasse os agendamentos da vitima.
- Policies permissivas `using (true)` removidas de `appointment_requests.sql` e policies de MVP sem login removidas de `onboarding_submissions.sql`. Reexecutar esses arquivos nao reabre mais as brechas.
- Frontend trata erro 23505 de slug duplicado no onboarding com mensagem amigavel.
- Em banco existente, executar `supabase/migration_2026-06-11_slug_unique_rls_hardening.sql`.
- `/api/persona-generate` agora exige login (JWT Supabase) e tem rate limit de 8 chamadas por 10 minutos por usuario. Requer `SUPABASE_URL` e `SUPABASE_ANON_KEY` (ou as variantes `VITE_`) no ambiente Vercel.

Prioridade alta:

1. Mitigar spam de agendamento anonimo (Turnstile/captcha ou confirmacao via WhatsApp). O indice unico de horario permite que reservas falsas bloqueiem a agenda.
2. Substituir `window.prompt` por modal leve ou painel contextual.
3. Criar campo e upload separado para imagem do CTA.
4. RLS de `appointment_requests`: insercao e apenas `anon`; usuario autenticado testando a propria landing publica nao consegue inserir. Avaliar policy de insert para authenticated.
5. Decidir semantica de checkout para hotelaria e ajustar reservas inclusivas se necessario.
6. Exibir e administrar `conversion_requests` na gestao operacional.
7. SEO: paginas publicas servem `<title>Persona</title>` generico. Avaliar meta tags dinamicas, pre-render ou Next.js.

Prioridade media:

1. Melhorar editor visual de redes sociais alem de Instagram.
2. Criar editor dedicado para `trustStats`.
3. Criar editor dedicado para `editorialHighlight`.
4. Incluir reservas por periodo nos graficos detalhados.
5. Adicionar testes automatizados.
6. Adicionar testes visuais responsivos.
7. Dividir bundle com lazy loading.
8. Considerar React Router se o numero de rotas crescer.

Prioridade baixa:

1. Avaliar remocao gradual de componentes legados.
2. Refinar recomendacao automatica do tema `dark-editorial` pela IA.
3. Consolidar divergencia entre tema local do preview e tema persistido.

## 29. Pontos de atencao ao editar

- Ler `git status --short` antes de mudar arquivos.
- Nao sobrescrever mudancas locais do usuario.
- Alterar primeiro `src/landing/` para recursos da landing dinamica.
- Alterar `src/components/` legado somente quando a tarefa atingir demos antigas.
- Preservar campos desconhecidos no payload.
- Validar comportamento como visitante e como dono.
- Validar mobile.
- Validar substituicao de imagem e remocao do arquivo anterior.
- Validar RLS com sessao autenticada e anonima.
- Rodar `npm run build`.
- Atualizar este arquivo se a arquitetura mudar.

## 30. Checklist rapido para retomar trabalho

```powershell
Set-Location "C:\SAAS EPICBYTE"
git status --short
npm run build
```

Depois:

1. Ler este documento.
2. Identificar a area da tarefa.
3. Abrir somente os arquivos relevantes.
4. Conferir SQL relacionado se houver alteracao de dados.
5. Testar preview publico.
6. Testar preview autenticado como dono.
7. Testar dashboard.
8. Testar `/agenda` se a mudanca envolver atendimento.
9. Testar viewport mobile.

## 31. Arquivos para abrir por tipo de tarefa

Landing e tema:

```text
src/pages/PreviewPage.jsx
src/landing/pageConfig.js
src/landing/theme.js
src/landing/presets.js
src/landing/*Module.jsx
```

Edicao contextual:

```text
src/pages/PreviewPage.jsx
src/landing/EditablePrimitives.jsx
```

Dashboard:

```text
src/pages/DashboardPage.jsx
src/components/dashboard/*
```

Agenda:

```text
src/pages/AgendaManagementPage.jsx
src/landing/ScheduleModule.jsx
src/landing/ReservationPeriodModule.jsx
src/components/dashboard/AgendaEditor.jsx
src/components/dashboard/ProfessionalManagement.jsx
```

IA:

```text
api/persona-generate.js
src/persona/personaPayload.js
src/persona/PersonaOnboarding.jsx
```

Supabase:

```text
src/lib/supabaseClient.js
supabase/*.sql
```

## 32. Convencao para atualizar este documento

Ao finalizar uma tarefa relevante, registrar:

- data;
- funcionalidade nova;
- arquivos principais alterados;
- SQL novo ou modificado;
- migracao necessaria;
- limitacao conhecida;
- teste executado;
- proximo risco evidente.

Historico inicial consolidado:

- personalizacao visual e painel mobile;
- controles do dono no header;
- Storage Supabase;
- upload inline;
- exclusao de imagem anterior;
- servicos editaveis inline;
- criacao e exclusao de servicos;
- galeria preenchivel;
- multiplas paginas por usuario;
- exclusao integral de imagens por pagina;
- IA adaptada para espacos reservaveis;
- calendario por intervalo de datas;
- gestao operacional separada;
- metricas corrigidas para reservas;
- tema premium `dark-editorial`;
- fallbacks inteligentes e CMS inline contextual.


import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  Paintbrush,
  Scissors,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Store,
  WandSparkles,
} from 'lucide-react';

const segments = [
  { name: 'Clínicas odontológicas', Icon: Stethoscope },
  { name: 'Estética e harmonização', Icon: Sparkles },
  { name: 'Barbearias', Icon: Scissors },
  { name: 'Salões de beleza', Icon: WandSparkles },
  { name: 'Consultórios', Icon: ShieldCheck },
  { name: 'Serviços por agenda', Icon: Store },
];

const features = [
  {
    title: 'Pagina personalizada por profissional',
    description: 'Nome, especialidade, imagem principal, serviços, galeria e depoimentos carregados automaticamente.',
    Icon: Paintbrush,
  },
  {
    title: 'Agenda online inteligente',
    description: 'Dias, horários, intervalos e bloqueios preparados para dados vindos do Supabase.',
    Icon: CalendarCheck,
  },
  {
    title: 'Painel pronto para evoluir',
    description: 'Base pensada para o profissional editar marca pessoal, serviços, horários e conteúdo da landing.',
    Icon: LayoutDashboard,
  },
  {
    title: 'Controle multi-tenant',
    description: 'Cada empresa opera seus próprios dados com isolamento por business_id e regras de segurança.',
    Icon: ShieldCheck,
  },
];

const steps = [
  'Preencha dados do profissional',
  'Cadastre serviços premium',
  'Defina dias e horários',
  'Publique a página com agenda',
];

export default function SaaSHome() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#f8fbff] text-brand-900">
      <SaaSHeader />
      <main>
        <section className="relative pt-28">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,#dff0ff_0,transparent_28%),radial-gradient(circle_at_85%_5%,#eee6ff_0,transparent_24%)]" />
          <div className="section-shell grid min-h-[760px] items-center gap-12 py-16 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="animate-reveal">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-4 py-2 text-sm font-bold text-brand-700 shadow-sm">
                <BadgeCheck size={18} />
                SaaS de agendamento personalizável
              </span>
              <h1 className="mt-7 max-w-4xl text-5xl font-extrabold leading-[1.04] sm:text-6xl lg:text-7xl">
                Crie páginas com agenda online para qualquer negócio que atende por horário.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                Uma plataforma para clínicas, salões, barbearias e esteticistas venderem melhor, receberem agendamentos e manterem sua presença digital sempre atualizada.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <a href="/onboarding" className="pill-button bg-brand-600 text-white shadow-glow hover:-translate-y-1 hover:bg-brand-700">
                  Criar minha página
                  <ArrowRight size={18} />
                </a>
                <a href="/demo/personapro" className="pill-button border border-slate-200 bg-white text-brand-900 shadow-sm hover:-translate-y-1 hover:border-brand-200 hover:text-brand-600">
                  Ver demo PersonaPro
                </a>
              </div>
            </div>

            <div className="relative animate-reveal [animation-delay:120ms]">
              <div className="rounded-[2.25rem] border border-white bg-white p-4 shadow-soft">
                <div className="rounded-[1.75rem] bg-[#f8fbff] p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-brand-600">Painel do cliente</p>
                      <h2 className="mt-2 text-2xl font-extrabold">Studio Bella</h2>
                    </div>
                    <span className="rounded-full bg-mint-50 px-4 py-2 text-sm font-bold text-mint-500">Publicado</span>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <Metric title="Agendamentos" value="148" Icon={CalendarCheck} />
                    <Metric title="Taxa de conversão" value="38%" Icon={BarChart3} />
                    <Metric title="Tempo medio" value="42min" Icon={Clock3} />
                    <Metric title="Serviços ativos" value="12" Icon={Sparkles} />
                  </div>

                  <div className="mt-6 rounded-3xl bg-white p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="font-extrabold">Próximos horários</p>
                      <span className="text-sm font-bold text-brand-600">Hoje</span>
                    </div>
                    {['Limpeza de pele - 14:00', 'Corte premium - 15:30', 'Avaliação - 17:00'].map((item) => (
                      <div key={item} className="mb-3 flex items-center gap-3 rounded-2xl bg-[#f8fbff] p-3 last:mb-0">
                        <CheckCircle2 size={19} className="text-mint-500" />
                        <span className="text-sm font-bold text-slate-600">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="segmentos" className="bg-white py-24">
          <div className="section-shell">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-extrabold uppercase text-brand-600">Segmentos</p>
              <h2 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">Um motor de agenda para vários mercados.</h2>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {segments.map(({ name, Icon }) => (
                <div key={name} className="rounded-[2rem] border border-slate-100 bg-[#fbfdff] p-6 shadow-sm transition hover:-translate-y-1 hover:bg-white hover:shadow-soft">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                    <Icon size={23} />
                  </span>
                  <p className="mt-5 text-lg font-extrabold">{name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="recursos" className="py-24">
          <div className="section-shell grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-sm font-extrabold uppercase text-brand-600">Produto</p>
              <h2 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">Personalização, agenda e dados no mesmo fluxo.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                A base foi pensada para ler tudo do Supabase e montar páginas públicas automaticamente para cada cliente.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {features.map(({ title, description, Icon }) => (
                <article key={title} className="rounded-[2rem] border border-white bg-white p-6 shadow-soft">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-lilac-50 text-lilac-600">
                    <Icon size={23} />
                  </span>
                  <h3 className="mt-5 text-lg font-extrabold">{title}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-24">
          <div className="section-shell">
            <div className="rounded-[2.5rem] bg-brand-900 p-8 shadow-soft sm:p-12 lg:p-16">
              <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                <div>
                  <p className="text-sm font-extrabold uppercase text-brand-100">Como funciona</p>
                  <h2 className="mt-4 text-4xl font-extrabold leading-tight text-white sm:text-5xl">Do formulário inicial a uma página publicada.</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {steps.map((step, index) => (
                    <div key={step} className="rounded-3xl bg-white/10 p-5 text-white">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-brand-700 text-sm font-extrabold">{index + 1}</span>
                      <p className="mt-5 font-bold leading-7">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
              <a href="/onboarding" className="pill-button mt-10 bg-white text-brand-700 hover:-translate-y-1 hover:bg-brand-50">
                Começar configuração
                <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function SaaSHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/70 bg-white/85 backdrop-blur-xl">
      <nav className="section-shell flex h-20 items-center justify-between">
        <a href="/" className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-600 text-white shadow-glow">
            <CalendarCheck size={23} />
          </span>
          <span className="text-xl font-extrabold">Persona</span>
        </a>
        <div className="hidden items-center gap-8 lg:flex">
          <a href="#segmentos" className="text-sm font-semibold text-slate-600 hover:text-brand-600">Segmentos</a>
          <a href="#recursos" className="text-sm font-semibold text-slate-600 hover:text-brand-600">Recursos</a>
          <a href="/demo/personapro" className="text-sm font-semibold text-slate-600 hover:text-brand-600">Demo</a>
        </div>
        <a href="/onboarding" className="pill-button bg-brand-600 text-white shadow-glow hover:bg-brand-700">Criar página</a>
      </nav>
    </header>
  );
}

function Metric({ title, value, Icon }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <Icon size={22} className="text-brand-600" />
      <p className="mt-4 text-2xl font-extrabold">{value}</p>
      <p className="mt-1 text-sm font-bold text-slate-500">{title}</p>
    </div>
  );
}

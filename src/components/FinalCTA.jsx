import { ArrowRight, CalendarDays, ShieldCheck } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="bg-white px-5 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-brand-900 shadow-soft">
        <div className="grid gap-8 p-8 sm:p-12 lg:grid-cols-[1fr_auto] lg:items-center lg:p-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-brand-100">
              <ShieldCheck size={18} />
              Tecnologia, cuidado e previsibilidade
            </span>
            <h2 className="mt-6 max-w-3xl text-3xl font-extrabold leading-tight text-white sm:text-5xl">
              Pronto para apresentar sua clínica com a experiência premium que seus pacientes esperam?
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-100">
              Use a primeira versão da PersonaPro como base para uma landing page real, conectada a agenda, profissionais e depoimentos do banco de dados.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
            <a href="#agenda" className="pill-button bg-white text-brand-700 hover:-translate-y-1 hover:bg-brand-50">
              <CalendarDays size={19} />
              Agendar consulta
            </a>
            <a href="#servicos" className="pill-button border border-white/20 bg-white/10 text-white hover:-translate-y-1 hover:bg-white/15">
              Ver serviços
              <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

import SectionHeading from './SectionHeading.jsx';
import { benefits } from '../data/landingData.js';

export default function Benefits() {
  return (
    <section className="relative py-24 sm:py-28">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_48%,#f6f2ff_100%)]" />
      <div className="section-shell grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <SectionHeading
            align="left"
            eyebrow="Beneficios"
            title="Uma jornada mais leve para equipe e paciente."
            description="A experiência combina processos digitais com o cuidado próximo que uma clínica odontológica premium precisa transmitir."
          />
          <a href="#agenda" className="pill-button mt-8 bg-brand-600 text-white shadow-glow hover:-translate-y-1 hover:bg-brand-700">
            Experimentar agenda online
          </a>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {benefits.map(({ title, description, Icon }, index) => (
            <article
              key={title}
              className="animate-reveal rounded-[2rem] border border-white bg-white p-6 shadow-soft transition duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-lilac-50 text-lilac-600">
                <Icon size={23} />
              </div>
              <h3 className="text-lg font-extrabold text-brand-900">{title}</h3>
              <p className="mt-3 leading-7 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

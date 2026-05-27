import { CalendarPlus } from 'lucide-react';
import SectionHeading from './SectionHeading.jsx';
import { dentists } from '../data/landingData.js';

export default function Team() {
  return (
    <section id="equipe" className="py-24 sm:py-28">
      <div className="section-shell">
        <div className="mx-auto flex justify-center">
          <SectionHeading
            eyebrow="Equipe especialista"
            title="Profissionais apresentados com autoridade, empatia e conversão."
            description="Cards prontos para receber fotos, especialidades, disponibilidade e indicadores reais de cada profissional."
          />
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {dentists.map((dentist, index) => (
            <article
              key={dentist.name}
              className="group animate-reveal overflow-hidden rounded-[2rem] border border-white bg-white shadow-soft transition duration-300 hover:-translate-y-2"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative h-80 overflow-hidden">
                <img src={dentist.image} alt={dentist.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-x-4 bottom-4 rounded-3xl bg-white/90 p-4 backdrop-blur">
                  <p className="text-xs font-bold uppercase text-brand-600">{dentist.experience}</p>
                  <h3 className="mt-1 text-xl font-extrabold text-brand-900">{dentist.name}</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="leading-7 text-slate-600">{dentist.specialty}</p>
                <a href="#agenda" className="pill-button mt-6 w-full bg-brand-50 text-brand-700 hover:bg-brand-600 hover:text-white">
                  <CalendarPlus size={18} />
                  Agendar com especialista
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

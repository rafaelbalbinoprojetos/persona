import SectionHeading from './SectionHeading.jsx';
import { services } from '../data/landingData.js';

export default function Services() {
  return (
    <section id="servicos" className="bg-white py-24 sm:py-28">
      <div className="section-shell">
        <div className="mx-auto flex justify-center">
          <SectionHeading
            eyebrow="Serviços integrados"
            title="Tudo que a clínica precisa para apresentar cuidado, tecnologia e resultado."
            description="Serviços organizados para conversão, com textos prontos para evoluir para dados vindos do banco ou painel administrativo."
          />
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map(({ title, description, Icon }, index) => (
            <article
              key={title}
              className="group animate-reveal rounded-[2rem] border border-slate-100 bg-[#fbfdff] p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-brand-100 hover:bg-white hover:shadow-soft"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="mb-7 grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 transition group-hover:scale-110 group-hover:bg-brand-600 group-hover:text-white">
                <Icon size={26} />
              </div>
              <h3 className="text-xl font-extrabold text-brand-900">{title}</h3>
              <p className="mt-3 leading-7 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

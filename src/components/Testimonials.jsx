import { Quote, Star } from 'lucide-react';
import SectionHeading from './SectionHeading.jsx';
import { testimonials } from '../data/landingData.js';

export default function Testimonials() {
  return (
    <section className="bg-white py-24 sm:py-28">
      <div className="section-shell">
        <div className="mx-auto flex justify-center">
          <SectionHeading
            eyebrow="Depoimentos"
            title="Confianca percebida antes, durante e depois da consulta."
            description="A prova social reforça segurança para pacientes novos e evidencia o padrão de atendimento da clínica."
          />
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <article
              key={testimonial.name}
              className="animate-reveal rounded-[2rem] border border-slate-100 bg-[#fbfdff] p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-soft"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-lilac-50 text-lilac-600">
                  <Quote size={22} />
                </span>
                <div className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Star key={starIndex} size={17} fill="currentColor" />
                  ))}
                </div>
              </div>
              <p className="mt-7 text-lg leading-8 text-slate-700">"{testimonial.quote}"</p>
              <div className="mt-8 border-t border-slate-100 pt-5">
                <p className="font-extrabold text-brand-900">{testimonial.name}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">{testimonial.role}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

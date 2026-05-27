import { ChevronDown } from 'lucide-react';
import SectionHeading from './SectionHeading.jsx';
import { faqs } from '../data/landingData.js';

export default function FAQ() {
  return (
    <section id="faq" className="py-24 sm:py-28">
      <div className="section-shell grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading
          align="left"
          eyebrow="FAQ"
          title="Perguntas frequentes para reduzir dúvidas e acelerar a decisão."
          description="Conteúdo preparado para crescer com regras da clínica, planos, formas de pagamento e protocolos de atendimento."
        />

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <details
              key={faq.question}
              className="group animate-reveal rounded-3xl border border-white bg-white p-6 shadow-soft"
              style={{ animationDelay: `${index * 80}ms` }}
              open={index === 0}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-extrabold text-brand-900">
                {faq.question}
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600 transition group-open:rotate-180">
                  <ChevronDown size={19} />
                </span>
              </summary>
              <p className="mt-4 max-w-3xl leading-8 text-slate-600">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

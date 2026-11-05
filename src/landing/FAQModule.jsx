import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { normalizeFaqs } from './landingUtils.js';
import { SectionIntro } from './LandingShared.jsx';

/**
 * Perguntas frequentes cadastradas pelo cliente.
 * Sem perguntas genéricas automáticas: sem conteúdo, a seção some para
 * visitantes; o dono vê um aviso discreto com atalho para o painel.
 */
export function FAQModule({ config, theme, editMode = false }) {
  const faqs = normalizeFaqs(config.faqs);
  const [openIndex, setOpenIndex] = useState(0);
  const baseId = useId();
  const editorial = theme.key === 'dark-editorial';

  if (!faqs.length) {
    if (!editMode) return null;
    return (
      <section id="faq" className="bg-[var(--preview-section)] py-16">
        <div className="section-shell">
          <div className="mx-auto max-w-2xl rounded-xl border border-dashed border-[var(--preview-border)] p-8 text-center">
            <p className="text-sm font-semibold">Perguntas frequentes (visível só para você)</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--preview-muted)]">
              Nenhuma pergunta cadastrada. Adicione perguntas no painel para exibir esta seção aos visitantes.
            </p>
            <a
              href={`/dashboard?slug=${encodeURIComponent(config.submission.slug)}`}
              className="mt-5 inline-flex h-10 items-center rounded-full border border-[var(--preview-border)] px-5 text-sm font-semibold text-[var(--preview-primary)] transition hover:border-[var(--preview-primary)]"
            >
              Abrir painel
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className={`${editorial ? 'bg-[#F8FAFC] text-slate-950' : 'bg-[var(--preview-section)]'} py-14 sm:py-24`}
    >
      <div className="section-shell grid gap-6 sm:gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <SectionIntro
          id="faq-title"
          eyebrow="Dúvidas frequentes"
          title="Perguntas frequentes"
          align="left"
          tone={editorial ? 'light' : 'default'}
        />
        <div className="divide-y divide-[var(--preview-border)] border-y border-[var(--preview-border)]">
          {faqs.map((faq, index) => {
            const open = openIndex === index;
            const buttonId = `${baseId}-q-${index}`;
            const panelId = `${baseId}-a-${index}`;
            return (
              <div key={`${faq.question}-${index}`}>
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(open ? -1 : index)}
                    className="flex w-full items-start justify-between gap-6 py-5 text-left text-base font-semibold leading-7 transition-colors hover:text-[var(--preview-primary)] sm:text-[1.0625rem]"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      size={20}
                      aria-hidden="true"
                      className={`mt-1 shrink-0 text-[var(--preview-muted)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    />
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!open}
                  className="pb-6 pr-10"
                >
                  <p className={`leading-7 ${editorial ? 'text-slate-600' : 'text-[var(--preview-muted)]'}`}>{faq.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

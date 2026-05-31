import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ChevronDown } from 'lucide-react';
import { cardClass } from './theme.js';
import { isVenueVertical, normalizeFaqs } from './landingUtils.js';
import { SectionIntro, cinematicEase, reveal, stagger } from './LandingShared.jsx';

export function FAQModule({ config, theme }) {
  const faqs = normalizeFaqs(config.faqs, config);
  const [openIndex, setOpenIndex] = useState(0);
  const isVenue = isVenueVertical(config.vertical);
  const editorial = theme.key === 'dark-editorial';

  if (!faqs.length) return null;

  return (
    <section id="faq" className={`${editorial ? 'bg-[#F8FAFC] text-slate-950' : 'bg-[var(--preview-section)]'} py-28`}>
      <div className="section-shell">
        <SectionIntro
          eyebrow="FAQ"
          title={isVenue ? 'Clareza antes da reserva' : 'Clareza antes do primeiro contato'}
          description={isVenue ? 'Informações essenciais para decidir, consultar disponibilidade e reservar sem atrito.' : 'Respostas diretas em uma experiência leve, premium e sem atrito.'}
          tone={editorial ? 'light' : 'default'}
        />
        <motion.div
          className="mx-auto mt-14 grid max-w-6xl gap-4 lg:grid-cols-2"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {faqs.map((faq, index) => (
            <motion.article
              key={`${faq.question}-${index}`}
              variants={reveal}
              className={editorial
                ? 'overflow-hidden border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]'
                : cardClass(theme, 'overflow-hidden shadow-[var(--preview-shadow)]')}
              style={{ borderRadius: theme.radius }}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                className="flex w-full items-center justify-between gap-5 p-6 text-left"
              >
                <span className="flex items-center gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--preview-surface)] text-[var(--preview-primary)]">
                    <CheckCircle2 size={18} />
                  </span>
                  <span className="text-lg font-extrabold">{faq.question}</span>
                </span>
                <motion.span animate={{ rotate: openIndex === index ? 180 : 0 }} transition={{ duration: 0.25 }}>
                  <ChevronDown size={20} />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.32, ease: cinematicEase }}
                  >
                    <p className={`px-6 pb-6 pl-20 leading-7 ${editorial ? 'text-slate-600' : 'text-[var(--preview-muted)]'}`}>{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

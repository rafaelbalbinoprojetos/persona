import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { cardClass } from './theme.js';
import { getFeaturedProfessional, getSignatureIntroCopy, getSignaturePillars } from './landingUtils.js';
import { SectionIntro, reveal, stagger } from './LandingShared.jsx';

export function SignatureModule({ config, theme, editMode = false, onProfessionalTextChange }) {
  const professional = getFeaturedProfessional(config);
  const philosophy = professional.bio || config.preset.professionalBio;
  const pillars = getSignaturePillars(config.vertical);
  const copy = getSignatureIntroCopy(config);
  const editorial = theme.key === 'dark-editorial';

  return (
    <section id="assinatura" className={`relative overflow-hidden py-28 ${editorial ? 'bg-[#05070D]' : 'bg-[var(--preview-section)]'}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[var(--preview-bg)] to-transparent" />
      {!editorial && <div className="pointer-events-none absolute right-[-10rem] top-20 h-96 w-96 rounded-full bg-[var(--preview-primary)]/10 blur-3xl" />}
      <div className="section-shell">
        <motion.div
          className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          <motion.div variants={reveal}>
            <p className="text-sm font-extrabold uppercase text-[var(--preview-primary)]">
              {copy.eyebrow}
            </p>
            <h2 className={`mt-5 max-w-3xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl ${editorial ? 'font-serif' : ''}`}>
              {copy.title}
            </h2>
          </motion.div>

          <motion.div
            variants={reveal}
            className={cardClass(theme, 'p-7 shadow-[var(--preview-shadow)]')}
            style={{ borderRadius: theme.radius }}
          >
            <p
              className={`rounded-2xl text-xl font-semibold leading-9 text-[var(--preview-text)] outline-none ${
                editMode ? 'cursor-text ring-2 ring-transparent transition focus:bg-[var(--preview-surface)] focus:px-3 focus:py-2 focus:ring-[var(--preview-primary)]/25' : ''
              }`}
              contentEditable={editMode}
              suppressContentEditableWarning
              onBlur={(event) => onProfessionalTextChange?.('bio', event.currentTarget.textContent)}
            >
              {philosophy}
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {pillars.map((pillar) => (
                <div
                  key={pillar}
                  className="rounded-3xl border border-[var(--preview-border)] bg-[var(--preview-surface)]/70 p-4"
                >
                  <CheckCircle2 size={19} className="mb-4 text-[var(--preview-accent)]" />
                  <p className="text-sm font-extrabold uppercase text-[var(--preview-muted)]">
                    {pillar}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

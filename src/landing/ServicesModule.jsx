import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cardClass } from './theme.js';
import { getImageCandidates, getUnsupportedImageReason } from './imageUtils.js';
import { getServiceEmotionalLine } from './landingUtils.js';
import { SectionIntro, reveal, stagger } from './LandingShared.jsx';

export function ServicesModule({ config, theme, editMode = false, onServiceTextChange }) {
  const { services, preset } = config;

  return (
    <section id="servicos" className="bg-[var(--preview-bg)] py-28">
      <div className="section-shell">
        <SectionIntro
          eyebrow={preset.sectionLabels.services}
          title="Experiências desenhadas com intenção"
          description="Serviços apresentados como uma assinatura profissional: claros, desejáveis e alinhados a uma presença premium."
        />
        <motion.div
          className="mt-14 grid gap-7 md:grid-cols-2 xl:grid-cols-3"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {services.map((service, index) => (
            <motion.article
              key={index}
              variants={reveal}
              whileHover={{ y: -10, scale: 1.01 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className={cardClass(theme, 'group overflow-hidden shadow-[var(--preview-shadow)]')}
              style={{ borderRadius: theme.radius }}
            >
              <ServiceImage src={service.image_url} alt={service.name} theme={theme} large />
              <div className="p-8">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[var(--preview-primary)]">
                    Experiência {String(index + 1).padStart(2, '0')}
                  </p>
                  <span className="rounded-full border border-[var(--preview-border)] bg-[var(--preview-surface)] px-3 py-1 text-xs font-extrabold text-[var(--preview-muted)]">
                    {service.duration || service.duration_minutes || 30} min
                  </span>
                </div>
                <h3
                  className={`rounded-xl text-3xl font-black tracking-[-0.025em] outline-none ${
                    editMode ? 'cursor-text ring-2 ring-transparent transition focus:bg-[var(--preview-surface)] focus:px-2 focus:py-1 focus:ring-[var(--preview-primary)]/25' : ''
                  }`}
                  contentEditable={editMode}
                  suppressContentEditableWarning
                  onBlur={(event) => onServiceTextChange?.(index, 'name', event.currentTarget.textContent)}
                >
                  {service.name}
                </h3>
                <p className="mt-3 text-sm font-extrabold uppercase tracking-[0.18em] text-[var(--preview-primary)]/80">
                  {getServiceEmotionalLine(config.vertical, index)}
                </p>
                <p
                  className={`mt-5 rounded-xl leading-8 text-[var(--preview-muted)] outline-none ${
                    editMode ? 'cursor-text ring-2 ring-transparent transition focus:bg-[var(--preview-surface)] focus:px-2 focus:py-1 focus:ring-[var(--preview-primary)]/25' : ''
                  }`}
                  contentEditable={editMode}
                  suppressContentEditableWarning
                  onBlur={(event) => onServiceTextChange?.(index, 'description', event.currentTarget.textContent)}
                >
                  {service.description || `Uma experiência personalizada e cuidadosamente conduzida para ${preset.label.toLowerCase()}.`}
                </p>
                {service.price && (
                  <p className="mt-7 text-lg font-black text-[var(--preview-primary)]">
                    A partir de R$ {service.price}
                  </p>
                )}
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Sub-componente ───────────────────────────────────────────────────────────

function ServiceImage({ src, alt, theme, large = false }) {
  const [failed, setFailed] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);
  const sources = useMemo(() => getImageCandidates(src), [src]);
  const unsupportedReason = getUnsupportedImageReason(src);
  const height = large ? 'h-72' : 'h-52';

  if (unsupportedReason || !sources.length || failed) {
    return (
      <div className={`grid ${height} place-items-center bg-[var(--preview-card)] text-center text-[var(--preview-primary)]`}>
        <div>
          <Sparkles size={42} className="mx-auto" />
          <p className="mt-3 px-6 text-sm font-bold text-[var(--preview-muted)]">
            {unsupportedReason || 'Imagem indisponível'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${height} overflow-hidden`}
      style={{ borderTopLeftRadius: theme.radius, borderTopRightRadius: theme.radius }}
    >
      <img
        src={sources[sourceIndex]}
        alt={alt}
        className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
        onError={() => {
          if (sourceIndex < sources.length - 1) setSourceIndex((current) => current + 1);
          else setFailed(true);
        }}
      />
    </div>
  );
}

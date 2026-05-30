import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ImagePlus, Plus, Sparkles, Trash2 } from 'lucide-react';
import { cardClass } from './theme.js';
import { getImageCandidates, getUnsupportedImageReason } from './imageUtils.js';
import { getServiceEmotionalLine, getServicesIntroCopy } from './landingUtils.js';
import { SectionIntro, reveal, stagger } from './LandingShared.jsx';

export function ServicesModule({
  config,
  theme,
  editMode = false,
  onServiceTextChange,
  onServiceImageUpload,
  onAddService,
  onRemoveService,
}) {
  const { services, preset } = config;
  const copy = getServicesIntroCopy(config);

  return (
    <section id="servicos" className="bg-[var(--preview-bg)] py-28">
      <div className="section-shell">
        <SectionIntro
          eyebrow={preset.sectionLabels.services}
          title={copy.title}
          description={copy.description}
        />
        {editMode && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={onAddService}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[var(--preview-border)] bg-[var(--preview-card)] px-5 text-sm font-extrabold text-[var(--preview-text)] shadow-[var(--preview-shadow)] transition hover:-translate-y-0.5 hover:text-[var(--preview-primary)]"
            >
              <Plus size={18} />
              Novo serviço
            </button>
          </div>
        )}
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
              data-service-index={index}
              variants={reveal}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -10, scale: 1.01 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className={cardClass(theme, 'group relative overflow-hidden shadow-[var(--preview-shadow)]')}
              style={{ borderRadius: theme.radius }}
            >
              {editMode && (
                <button
                  type="button"
                  onClick={() => onRemoveService?.(index)}
                  className="absolute left-4 top-4 z-30 inline-flex h-10 items-center justify-center gap-2 rounded-full border border-red-200/70 bg-red-600/90 px-3 text-xs font-extrabold text-white shadow-2xl backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-red-700"
                  aria-label="Excluir serviço"
                >
                  <Trash2 size={15} />
                  Excluir
                </button>
              )}
              <ServiceImage
                src={service.image_url}
                alt={service.name}
                theme={theme}
                large
                editMode={editMode}
                onImageUpload={(file) => onServiceImageUpload?.(index, file)}
              />
              <div className="p-8">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[var(--preview-primary)]">
                    {copy.cardPrefix} {String(index + 1).padStart(2, '0')}
                  </p>
                  <span className="rounded-full border border-[var(--preview-border)] bg-[var(--preview-surface)] px-3 py-1 text-xs font-extrabold text-[var(--preview-muted)]">
                    {service.duration || service.duration_minutes || 30} {copy.durationSuffix}
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
                  {service.description || copy.emptyDescription}
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

function ServiceImage({ src, alt, theme, large = false, editMode = false, onImageUpload }) {
  const [failed, setFailed] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);
  const sources = useMemo(() => getImageCandidates(src), [src]);
  const unsupportedReason = getUnsupportedImageReason(src);
  const height = large ? 'h-72' : 'h-52';

  if (unsupportedReason || !sources.length || failed) {
    return (
      <div className={`relative grid ${height} place-items-center bg-[var(--preview-card)] text-center text-[var(--preview-primary)]`}>
        {editMode && <ServiceImageUploadButton onImageUpload={onImageUpload} />}
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
      className={`relative ${height} overflow-hidden`}
      style={{ borderTopLeftRadius: theme.radius, borderTopRightRadius: theme.radius }}
    >
      {editMode && <ServiceImageUploadButton onImageUpload={onImageUpload} />}
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

function ServiceImageUploadButton({ onImageUpload }) {
  return (
    <label className="absolute right-4 top-4 z-20 inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border border-white/25 bg-black/50 px-3 text-xs font-extrabold text-white shadow-2xl backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-black/65">
      <ImagePlus size={16} />
      Trocar
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onImageUpload?.(file);
          event.target.value = '';
        }}
      />
    </label>
  );
}

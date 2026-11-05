import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ImagePlus, Loader2 } from 'lucide-react';
import { buttonClass } from './theme.js';
import { getImageCandidates } from './imageUtils.js';
import { getFeaturedProfessional } from './landingUtils.js';
import { reveal, stagger } from './LandingShared.jsx';

/**
 * Hero em duas colunas: texto sobre fundo sólido e foto do cliente em um
 * quadro próprio. O texto nunca fica sobre a foto, então não compete com
 * rostos nem perde contraste, independentemente da imagem enviada.
 */
export function HeroModule({
  config,
  theme,
  editMode = false,
  editStatus,
  primaryCta,
  secondaryCta,
  onHeroTextChange,
  onProfessionalTextChange,
  onHeroImageUpload,
}) {
  const { business, branding } = config;
  const professional = getFeaturedProfessional(config);
  const heroImageUrls = getImageCandidates(branding.hero_image_url);
  const [imageFailed, setImageFailed] = useState(false);
  const hasImage = heroImageUrls.length > 0 && !imageFailed;
  const showMedia = hasImage || editMode;
  const eyebrow = professional.specialty || business.segment || '';
  const hasDistinctProfessional = professional.name && professional.name !== business.name;
  const editable = (extra = '') =>
    editMode
      ? `cursor-text rounded-md outline-none ring-1 ring-transparent transition hover:ring-[var(--preview-primary)]/30 focus:ring-2 focus:ring-[var(--preview-primary)]/40 ${extra}`
      : extra;
  const solidButton = theme.buttonStyle === 'outline' ? undefined : { backgroundColor: theme.primary };

  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="relative bg-[var(--preview-section)] pb-10 pt-[4.75rem] sm:pb-20 sm:pt-28 lg:pb-24 lg:pt-32"
    >
      <div
        className={`section-shell grid items-center gap-6 sm:gap-10 lg:gap-16 ${
          showMedia ? 'lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]' : ''
        }`}
      >
        <motion.div
          className={showMedia ? 'max-w-xl' : 'max-w-3xl'}
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {(eyebrow || editMode) && (
            <motion.p
              variants={reveal}
              className={editable('text-xs font-semibold uppercase tracking-[0.18em] text-[var(--preview-primary)]')}
              contentEditable={editMode}
              suppressContentEditableWarning
              onBlur={(event) => onProfessionalTextChange?.('specialty', event.currentTarget.textContent)}
            >
              {eyebrow || (editMode ? 'Especialidade' : '')}
            </motion.p>
          )}

          <motion.h1
            id="hero-title"
            variants={reveal}
            className={editable(
              'landing-display mt-3 text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.015em] min-[390px]:text-[1.95rem] sm:mt-4 sm:text-5xl sm:leading-[1.08] lg:text-[3.5rem]',
            )}
            contentEditable={editMode}
            suppressContentEditableWarning
            onBlur={(event) => onHeroTextChange?.('hero_title', event.currentTarget.textContent)}
          >
            {branding.hero_title}
          </motion.h1>

          {(branding.hero_subtitle || editMode) && (
            <motion.p
              variants={reveal}
              className={editable('mt-3 max-w-lg text-[0.9375rem] leading-6 text-[var(--preview-text-soft)] sm:mt-5 sm:text-lg sm:leading-8')}
              contentEditable={editMode}
              suppressContentEditableWarning
              data-placeholder="Texto de apoio"
              onBlur={(event) => onHeroTextChange?.('hero_subtitle', event.currentTarget.textContent)}
            >
              {branding.hero_subtitle}
            </motion.p>
          )}

          {(primaryCta || secondaryCta) && (
            <motion.div variants={reveal} className="mt-6 flex flex-col gap-1 sm:mt-8 sm:flex-row sm:items-center sm:gap-3">
              {primaryCta && (
                <a href={primaryCta.href} className={buttonClass(theme, 'h-12 w-full whitespace-nowrap px-7 sm:w-auto')} style={solidButton}>
                  {primaryCta.label}
                  <ArrowRight size={18} aria-hidden="true" />
                </a>
              )}
              {secondaryCta && (
                <a
                  href={secondaryCta.href}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-[var(--preview-text)] underline-offset-4 transition hover:text-[var(--preview-primary)] hover:underline"
                >
                  {secondaryCta.label}
                </a>
              )}
            </motion.div>
          )}

          {(hasDistinctProfessional || professional.registration || editMode) && (
            <motion.div
              variants={reveal}
              className="mt-6 flex items-center gap-4 border-t border-[var(--preview-border)] pt-4 text-sm sm:mt-10 sm:pt-6"
            >
              <div>
                <p
                  className={editable('font-semibold text-[var(--preview-text)]')}
                  contentEditable={editMode}
                  suppressContentEditableWarning
                  onBlur={(event) => onProfessionalTextChange?.('name', event.currentTarget.textContent)}
                >
                  {professional.name}
                </p>
                {professional.registration && (
                  <p className="mt-0.5 text-[var(--preview-muted)]">{professional.registration}</p>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>

        {showMedia && (
          <motion.figure
            className="relative order-first lg:order-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="relative aspect-[4/3] overflow-hidden bg-[var(--preview-card)] sm:aspect-[16/10] lg:aspect-[4/5]"
              style={{ borderRadius: theme.heroRadius }}
            >
              {hasImage ? (
                <HeroImage
                  sources={heroImageUrls}
                  alt={branding.hero_image_alt || `${business.name}`}
                  position={branding.hero_image_position}
                  onFail={() => setImageFailed(true)}
                />
              ) : (
                <div className="grid h-full place-items-center border border-dashed border-[var(--preview-border)] text-center text-sm text-[var(--preview-muted)]" style={{ borderRadius: theme.heroRadius }}>
                  <span className="px-6">Adicione uma foto da clínica, da equipe ou do ambiente.</span>
                </div>
              )}
              {editMode && <HeroEditToolbar status={editStatus} onImageUpload={onHeroImageUpload} hasImage={hasImage} />}
            </div>
            {/* Detalhe discreto de marca: filete na cor principal. */}
            <span
              aria-hidden="true"
              className="absolute -bottom-3 left-8 hidden h-1 w-24 lg:block"
              style={{ backgroundColor: theme.primary, borderRadius: 999 }}
            />
          </motion.figure>
        )}
      </div>
    </section>
  );
}

function HeroImage({ sources, alt, position, onFail }) {
  const [sourceIndex, setSourceIndex] = useState(0);
  return (
    <img
      src={sources[sourceIndex]}
      alt={alt}
      fetchPriority="high"
      decoding="async"
      className="h-full w-full object-cover"
      style={{ objectPosition: position || 'center 30%' }}
      onError={() => {
        if (sourceIndex < sources.length - 1) setSourceIndex((current) => current + 1);
        else onFail();
      }}
    />
  );
}

function HeroEditToolbar({ status, onImageUpload, hasImage }) {
  const isSaving = status?.type === 'saving';

  return (
    <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-2">
      <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-black/60 px-4 text-sm font-semibold text-white backdrop-blur transition hover:bg-black/75">
        {isSaving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <ImagePlus size={16} aria-hidden="true" />}
        {hasImage ? 'Trocar imagem' : 'Adicionar imagem'}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={isSaving}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onImageUpload?.(file);
            event.target.value = '';
          }}
        />
      </label>
      {status?.message && (
        <div
          role="status"
          className={`max-w-xs rounded-lg border px-3 py-2 text-right text-xs font-semibold ${
            status.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : status.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-white/20 bg-black/60 text-white'
          }`}
        >
          {status.message}
        </div>
      )}
    </div>
  );
}

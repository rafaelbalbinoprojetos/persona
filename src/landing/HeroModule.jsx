import { useState, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, CalendarDays, CheckCircle2, ImagePlus, Loader2, Play, Sparkles } from 'lucide-react';
import { buttonClass, cardClass } from './theme.js';
import { getNextAvailabilityLabel } from './dateUtils.js';
import { getImageCandidates } from './imageUtils.js';
import { getFeaturedProfessional, getHeroMicrocopy, getSocialLinks } from './landingUtils.js';
import { AnimatedMesh, AtmosphericParticles, cinematicEase, reveal, stagger } from './LandingShared.jsx';

export function HeroModule({
  config,
  theme,
  editMode = false,
  editStatus,
  onHeroTextChange,
  onProfessionalTextChange,
  onHeroImageUpload,
}) {
  const { business, branding, preset, services, availability } = config;
  const professional = getFeaturedProfessional(config);
  const professionalName = professional.name || business.name;
  const specialty = professional.specialty || preset.label;
  const heroImageUrls = getImageCandidates(branding.hero_image_url);
  const nextAvailability = getNextAvailabilityLabel(availability);
  const socialLinks = getSocialLinks(config);
  const heroCopy = getHeroMicrocopy(config);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 45, damping: 24, mass: 0.8 });
  const smoothY = useSpring(pointerY, { stiffness: 45, damping: 24, mass: 0.8 });
  const imageX = useTransform(smoothX, [-0.5, 0.5], ['0.8%', '-0.8%']);
  const imageY = useTransform(smoothY, [-0.5, 0.5], ['0.6%', '-0.6%']);
  const glowX = useTransform(smoothX, [-0.5, 0.5], ['-18px', '18px']);
  const glowY = useTransform(smoothY, [-0.5, 0.5], ['-14px', '14px']);

  function handleHeroMouseMove(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
  }

  return (
    <section id="top" className="relative overflow-hidden bg-[var(--preview-section)] px-4 pb-8 pt-24 sm:px-6 lg:px-8">
      <AnimatedMesh />
      <div
        className="relative mx-auto min-h-[760px] max-w-[1500px] overflow-hidden shadow-[var(--preview-shadow)] sm:min-h-[820px] lg:min-h-[860px]"
        style={{ borderRadius: theme.heroRadius }}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={() => { pointerX.set(0); pointerY.set(0); }}
      >
        <HeroBackdrop sources={heroImageUrls} alt={business.name} x={imageX} y={imageY} />
        {editMode && (
          <HeroEditToolbar
            status={editStatus}
            onImageUpload={onHeroImageUpload}
          />
        )}
        <div className="absolute inset-0" style={{ background: theme.heroOverlay }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_20%,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_18%_64%,var(--preview-primary)_0,transparent_30%),linear-gradient(180deg,transparent_45%,var(--preview-bg)_112%)] opacity-30" />
        <AtmosphericParticles />
        <motion.div
          aria-hidden="true"
          className="absolute left-[39%] top-[18%] hidden h-60 w-60 rounded-full bg-white/20 blur-3xl lg:block"
          style={{ x: glowX, y: glowY }}
          animate={{ y: [0, 22, 0], opacity: [0.25, 0.42, 0.25] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-10 flex min-h-[760px] flex-col justify-start px-6 pb-44 pt-20 sm:min-h-[820px] sm:px-10 sm:pt-24 lg:min-h-[860px] lg:px-16 lg:pt-28">
          <motion.div className="max-w-[720px]" variants={stagger} initial="hidden" animate="visible">
            <motion.span
              variants={reveal}
              className={cardClass(theme, 'mb-7 inline-flex items-center gap-3 px-5 py-3 text-sm font-bold text-[var(--preview-primary)] shadow-sm')}
            >
              <Sparkles size={19} />
              <span
                className={editMode ? 'cursor-text rounded-lg outline-none ring-2 ring-transparent focus:bg-white/10 focus:px-1.5 focus:ring-[var(--preview-primary)]/30' : ''}
                contentEditable={editMode}
                suppressContentEditableWarning
                onBlur={(event) => onProfessionalTextChange?.('specialty', event.currentTarget.textContent)}
              >
                {specialty}
              </span>
            </motion.span>
            <motion.p variants={reveal} className="text-sm font-extrabold uppercase tracking-[0.28em] text-[var(--preview-primary)]">
              {heroCopy.eyebrow}
            </motion.p>
            <motion.h1
              variants={reveal}
              className={`mt-5 max-w-4xl rounded-2xl text-5xl font-black leading-[0.98] tracking-[-0.035em] outline-none sm:text-6xl lg:text-8xl ${
                editMode ? 'cursor-text ring-2 ring-transparent transition focus:bg-white/10 focus:px-3 focus:py-2 focus:ring-white/35' : ''
              }`}
              contentEditable={editMode}
              suppressContentEditableWarning
              onBlur={(event) => onProfessionalTextChange?.('name', event.currentTarget.textContent)}
            >
              {professionalName}
            </motion.h1>
            <motion.h2
              variants={reveal}
              className={`mt-7 max-w-3xl rounded-2xl text-2xl font-extrabold leading-tight text-[var(--preview-text)]/90 outline-none sm:text-3xl lg:text-4xl ${
                editMode ? 'cursor-text ring-2 ring-transparent transition focus:bg-white/10 focus:px-3 focus:py-2 focus:ring-white/35' : ''
              }`}
              contentEditable={editMode}
              suppressContentEditableWarning
              onBlur={(event) => onHeroTextChange?.('hero_title', event.currentTarget.textContent)}
            >
              {branding.hero_title}
            </motion.h2>
            <motion.p
              variants={reveal}
              className={`mt-6 max-w-2xl rounded-2xl text-lg leading-8 text-[var(--preview-muted)] outline-none sm:text-xl ${
                editMode ? 'cursor-text ring-2 ring-transparent transition focus:bg-white/10 focus:px-3 focus:py-2 focus:ring-white/35' : ''
              }`}
              contentEditable={editMode}
              suppressContentEditableWarning
              onBlur={(event) => onHeroTextChange?.('hero_subtitle', event.currentTarget.textContent)}
            >
              {branding.hero_subtitle}
            </motion.p>
            <motion.div variants={reveal} className="mt-10 flex flex-col gap-4 sm:flex-row">
              <motion.a
                href="#agenda"
                whileHover={{ y: -3, scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                className={buttonClass(theme)}
                style={theme.buttonStyle === 'outline' ? undefined : { backgroundColor: theme.primary }}
              >
                <CalendarDays size={19} />
                {heroCopy.primaryCta}
              </motion.a>
              <motion.a
                href="#assinatura"
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="pill-button border border-[var(--preview-border)] bg-[var(--preview-surface)]/70 text-[var(--preview-text)] shadow-sm backdrop-blur-xl hover:-translate-y-1"
              >
                <Play size={18} fill="currentColor" />
                {heroCopy.secondaryCta}
              </motion.a>
            </motion.div>
          </motion.div>
        </div>

        <HeroFloatingCard
          title={heroCopy.trustTitle}
          subtitle={`${services.length} ${heroCopy.countLabel}`}
          Icon={CheckCircle2}
          className="right-6 top-28 lg:right-10 lg:top-32"
        />
        <HeroFloatingCard
          title={nextAvailability}
          subtitle={heroCopy.availabilitySubtitle}
          Icon={CalendarDays}
          className="bottom-8 right-6 md:bottom-16 lg:right-16"
          featured
        />
        <HeroSocialProofCard
          socialLinks={socialLinks}
          professional={professional}
          title={heroCopy.socialTitle}
          className="bottom-8 left-6 lg:bottom-14 lg:left-16"
        />
      </div>
    </section>
  );
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function HeroBackdrop({ sources, alt, x, y }) {
  const [failed, setFailed] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);

  if (!sources.length || failed) {
    return <div className="absolute inset-0" style={{ background: 'var(--preview-fallback)' }} />;
  }

  return (
    <motion.img
      src={sources[sourceIndex]}
      alt={alt}
      className="absolute inset-0 h-full w-full object-cover object-[64%_center]"
      initial={{ scale: 1 }}
      animate={{ scale: 1.03 }}
      style={{ x, y }}
      transition={{ scale: { duration: 18, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' } }}
      onError={() => {
        if (sourceIndex < sources.length - 1) setSourceIndex((current) => current + 1);
        else setFailed(true);
      }}
    />
  );
}

function HeroEditToolbar({ status, onImageUpload }) {
  const isSaving = status?.type === 'saving';

  return (
    <div className="absolute right-4 top-4 z-30 flex flex-col items-end gap-2 sm:right-6 sm:top-6">
      <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-white/25 bg-black/45 px-4 text-sm font-extrabold text-white shadow-2xl backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-black/60">
        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
        Trocar imagem
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
          className={`max-w-xs rounded-2xl border px-4 py-2 text-right text-xs font-bold shadow-2xl backdrop-blur-xl ${
            status.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : status.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-white/20 bg-black/45 text-white'
          }`}
        >
          {status.message}
        </div>
      )}
    </div>
  );
}

function HeroFloatingCard({ title, subtitle, Icon, className, featured = false }) {
  return (
    <motion.div
      className={`glass-panel absolute z-20 hidden rounded-[1.6rem] px-5 py-4 shadow-[var(--preview-shadow)] backdrop-blur-2xl md:block ${className}`}
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: featured ? 0.55 : 0.35, ease: cinematicEase }}
    >
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--preview-card)] text-[var(--preview-primary)]">
          <Icon size={21} />
        </span>
        <div>
          <p className={`${featured ? 'text-xl' : 'text-base'} font-black text-[var(--preview-text)]`}>{title}</p>
          <p className="mt-1 text-sm font-semibold text-[var(--preview-muted)]">{subtitle}</p>
        </div>
      </div>
    </motion.div>
  );
}

function HeroSocialProofCard({ socialLinks, professional, title, className }) {
  const primarySocial = socialLinks[0];
  if (!primarySocial) return null;

  return (
    <motion.a
      href={primarySocial.href}
      target="_blank"
      rel="noreferrer"
      className={`glass-panel absolute z-20 hidden rounded-[1.6rem] px-5 py-4 shadow-[var(--preview-shadow)] backdrop-blur-2xl md:block ${className}`}
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.8, delay: 0.65, ease: cinematicEase }}
    >
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--preview-card)] text-[var(--preview-primary)]">
          <primarySocial.Icon size={21} />
        </span>
        <div>
          <p className="font-black text-[var(--preview-text)]">{title}</p>
          <p className="mt-1 text-sm font-semibold text-[var(--preview-muted)]">
            {primarySocial.handle || professional.name}
          </p>
        </div>
      </div>
    </motion.a>
  );
}

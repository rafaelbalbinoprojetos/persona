import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { getImageCandidates } from './imageUtils.js';
import { getFeaturedProfessional, getSocialLinks } from './landingUtils.js';
import { reveal } from './LandingShared.jsx';

export function FinalCTAModule({ config, theme, editMode = false, onFinalCtaTextChange }) {
  const professional = getFeaturedProfessional(config);
  const imageSources = getImageCandidates(professional.photo_url || config.branding.hero_image_url);
  const socialLinks = getSocialLinks(config);
  const primarySocial = socialLinks[0];
  const defaultSubtitle = `Agende uma avaliação com ${professional.name || config.business.name} e tenha uma experiência conduzida com clareza, cuidado e presença profissional.`;
  const finalCta = {
    title: config.finalCta?.title || 'Pronto para começar sua transformação?',
    subtitle: config.finalCta?.subtitle || defaultSubtitle,
    buttonLabel: config.finalCta?.buttonLabel || 'Agendar avaliação',
  };

  return (
    <section className="relative overflow-hidden bg-[var(--preview-section)] py-28">
      <div className="section-shell">
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="relative overflow-hidden p-8 text-white shadow-[var(--preview-glow)] sm:p-12 lg:p-16"
          style={{
            background: `radial-gradient(circle at 78% 15%, ${theme.accent}55 0, transparent 28%), linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            borderRadius: theme.heroRadius,
          }}
        >
          <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -bottom-24 right-16 h-72 w-72 rounded-full bg-black/20 blur-3xl" />

          <div className="relative z-10 grid gap-10 lg:grid-cols-[1fr_320px] lg:items-center">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.26em] text-white/70">
                Próximo passo
              </p>
              <h2
                className={`mt-5 max-w-3xl rounded-2xl text-4xl font-black leading-tight tracking-[-0.03em] outline-none sm:text-5xl lg:text-6xl ${
                  editMode ? 'cursor-text ring-2 ring-transparent transition focus:bg-white/10 focus:px-3 focus:py-2 focus:ring-white/35' : ''
                }`}
                contentEditable={editMode}
                suppressContentEditableWarning
                onBlur={(event) => onFinalCtaTextChange?.('title', event.currentTarget.textContent)}
              >
                {finalCta.title}
              </h2>
              <p
                className={`mt-6 max-w-2xl rounded-2xl text-lg font-semibold leading-8 text-white/80 outline-none ${
                  editMode ? 'cursor-text ring-2 ring-transparent transition focus:bg-white/10 focus:px-3 focus:py-2 focus:ring-white/35' : ''
                }`}
                contentEditable={editMode}
                suppressContentEditableWarning
                onBlur={(event) => onFinalCtaTextChange?.('subtitle', event.currentTarget.textContent)}
              >
                {finalCta.subtitle}
              </p>
              <a
                href="#agenda"
                className="pill-button mt-9 bg-white text-[var(--preview-primary)] shadow-2xl"
              >
                <span
                  className={editMode ? 'cursor-text rounded-lg outline-none ring-2 ring-transparent focus:bg-[var(--preview-primary)]/10 focus:px-1.5 focus:ring-[var(--preview-primary)]/25' : ''}
                  contentEditable={editMode}
                  suppressContentEditableWarning
                  onClick={(event) => {
                    if (editMode) event.preventDefault();
                  }}
                  onBlur={(event) => onFinalCtaTextChange?.('buttonLabel', event.currentTarget.textContent)}
                >
                  {finalCta.buttonLabel}
                </span>
                <ArrowRight size={18} />
              </a>
            </div>

            <div className="hidden space-y-4 lg:block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/20 bg-white/15 shadow-2xl">
                {imageSources.length ? (
                  <img
                    src={imageSources[0]}
                    alt={professional.name || config.business.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-6xl font-black">
                    {(professional.name || config.business.name || 'P').charAt(0)}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
              </div>

              {primarySocial && (
                <motion.a
                  href={primarySocial.href}
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="flex items-center gap-4 rounded-[1.5rem] border border-white/20 bg-white/14 p-4 shadow-2xl backdrop-blur-2xl"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-white/18">
                    <primarySocial.Icon size={21} />
                  </span>
                  <span>
                    <span className="block text-xs font-black uppercase tracking-[0.22em] text-white/60">
                      Acompanhe
                    </span>
                    <span className="mt-1 block font-black">
                      {primarySocial.handle || primarySocial.label}
                    </span>
                  </span>
                </motion.a>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

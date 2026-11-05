import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { isVenueVertical } from './landingUtils.js';
import { reveal } from './LandingShared.jsx';

/**
 * Chamada final. Faixa sólida na cor secundária (azul-marinho no tema
 * padrão), com textos editáveis e no máximo duas ações funcionais.
 */
export function FinalCTAModule({ config, theme, editMode = false, ctaHref = '', onFinalCtaTextChange }) {
  const isVenue = isVenueVertical(config.vertical);
  const whatsapp = String(config.business.whatsapp || config.submission.whatsapp || '').replace(/\D/g, '');
  const whatsappHref = whatsapp ? `https://wa.me/${whatsapp.length <= 11 ? `55${whatsapp}` : whatsapp}` : '';
  const finalCta = {
    title: config.finalCta?.title || (isVenue ? 'Consulte a disponibilidade da sua data' : 'Agende seu atendimento'),
    subtitle: config.finalCta?.subtitle || '',
    buttonLabel: config.finalCta?.buttonLabel || (isVenue ? 'Solicitar reserva' : 'Agendar agora'),
  };

  if (!ctaHref && !whatsappHref && !editMode) return null;

  const editable = (extra = '') =>
    editMode
      ? `cursor-text rounded-md outline-none ring-1 ring-transparent transition hover:ring-white/30 focus:ring-2 focus:ring-white/50 ${extra}`
      : extra;

  return (
    <section aria-labelledby="cta-final-title" className="bg-[var(--preview-bg)] py-12 sm:py-20">
      <div className="section-shell">
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="flex flex-col gap-8 px-6 py-12 text-white sm:px-12 sm:py-14 lg:flex-row lg:items-center lg:justify-between lg:px-16"
          style={{ backgroundColor: theme.secondary || theme.primary, borderRadius: theme.heroRadius }}
        >
          <div className="max-w-2xl">
            <h2
              id="cta-final-title"
              className={editable('landing-display text-[1.875rem] font-semibold leading-tight tracking-[-0.015em] sm:text-[2.25rem]')}
              contentEditable={editMode}
              suppressContentEditableWarning
              onBlur={(event) => onFinalCtaTextChange?.('title', event.currentTarget.textContent)}
            >
              {finalCta.title}
            </h2>
            {(finalCta.subtitle || editMode) && (
              <p
                className={editable('mt-4 text-base leading-7 text-white/80 sm:text-lg')}
                contentEditable={editMode}
                suppressContentEditableWarning
                data-placeholder="Texto de apoio (opcional)"
                onBlur={(event) => onFinalCtaTextChange?.('subtitle', event.currentTarget.textContent)}
              >
                {finalCta.subtitle}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            {(ctaHref || editMode) && (
              <a
                href={ctaHref || '#top'}
                onClick={(event) => { if (editMode) event.preventDefault(); }}
                className="pill-button h-12 bg-white px-7 text-[var(--preview-text)] hover:bg-white/90"
              >
                <span
                  className={editable()}
                  contentEditable={editMode}
                  suppressContentEditableWarning
                  onBlur={(event) => onFinalCtaTextChange?.('buttonLabel', event.currentTarget.textContent)}
                >
                  {finalCta.buttonLabel}
                </span>
                <ArrowRight size={18} aria-hidden="true" />
              </a>
            )}
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="pill-button h-12 border border-white/30 px-6 text-white hover:bg-white/10"
              >
                Conversar no WhatsApp
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

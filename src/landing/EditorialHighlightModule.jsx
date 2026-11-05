import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { getImageCandidates } from './imageUtils.js';
import { reveal, stagger } from './LandingShared.jsx';

/** Há conteúdo real de destaque cadastrado pelo cliente? */
export function hasEditorialContent(config) {
  const saved = config.editorialHighlight || {};
  return Boolean(String(saved.title || '').trim());
}

/**
 * Apresentação / benefícios da clínica, 100% a partir de
 * payload.editorialHighlight. Sem texto ou benefícios de exemplo.
 * A imagem é opcional: sem ela, o bloco vira uma composição só de texto
 * (sem quadro vazio).
 */
export function EditorialHighlightModule({ config, theme }) {
  const saved = config.editorialHighlight || {};
  const [imageFailed, setImageFailed] = useState(false);
  if (!hasEditorialContent(config)) return null;

  const imageUrl = saved.image_url || saved.imageUrl || '';
  const imageSources = getImageCandidates(imageUrl);
  const hasImage = imageSources.length > 0 && !imageFailed;
  const benefits = (Array.isArray(saved.benefits) ? saved.benefits : [])
    .map((item) => String(typeof item === 'string' ? item : item?.title || '').trim())
    .filter(Boolean)
    .slice(0, 6);
  const editorial = theme?.key === 'dark-editorial';

  return (
    <section
      id="sobre"
      aria-labelledby="sobre-title"
      className={`${editorial ? 'bg-[#F8FAFC] text-slate-950' : 'bg-[var(--preview-bg)]'} py-14 sm:py-24`}
    >
      <motion.div
        className={`section-shell grid items-center gap-6 sm:gap-10 lg:gap-16 ${hasImage ? 'lg:grid-cols-2' : ''}`}
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
      >
        {hasImage && (
          <motion.div
            variants={reveal}
            className="relative aspect-[4/3] overflow-hidden bg-[var(--preview-card)] lg:aspect-[5/4]"
            style={{ borderRadius: theme?.radius }}
          >
            <img
              src={imageSources[0]}
              alt={saved.image_alt || saved.title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
              onError={() => setImageFailed(true)}
            />
          </motion.div>
        )}

        <motion.div variants={reveal} className={hasImage ? '' : 'max-w-3xl'}>
          {saved.eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--preview-primary)]">{saved.eyebrow}</p>
          )}
          <h2 id="sobre-title" className="landing-display mt-3 text-[1.625rem] font-semibold leading-tight tracking-[-0.015em] sm:text-[2.5rem]">
            {saved.title}
          </h2>
          {saved.description && (
            <p className={`mt-3 text-[0.9375rem] leading-7 sm:mt-5 sm:text-lg sm:leading-8 ${editorial ? 'text-slate-600' : 'text-[var(--preview-text-soft)]'}`}>
              {saved.description}
            </p>
          )}
          {benefits.length > 0 && (
            <ul className={`mt-6 grid gap-x-8 gap-y-3 sm:mt-8 ${hasImage ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 border-t border-[var(--preview-border)] pt-4 text-[0.9375rem] font-medium">
                  <Check size={18} className="mt-0.5 shrink-0 text-[var(--preview-primary)]" aria-hidden="true" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}

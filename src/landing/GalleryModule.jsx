import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cardClass } from './theme.js';
import { getImageCandidates } from './imageUtils.js';
import { normalizeGalleryItems } from './landingUtils.js';
import { SectionIntro, reveal, stagger } from './LandingShared.jsx';

export function GalleryModule({ config, theme }) {
  const { gallery } = config;
  const galleryItems = normalizeGalleryItems(gallery)
    .filter((item, index, list) => {
      const source = item.image_url || item.url;
      return source && list.findIndex((candidate) => (candidate.image_url || candidate.url) === source) === index;
    })
    .slice(0, 6);

  if (!galleryItems.length) {
    return (
      <section id="galeria" className="bg-[var(--preview-bg)] py-28">
        <div className="section-shell">
          <SectionIntro
            eyebrow="Galeria"
            title="Narrativa visual em construção"
            description="Cadastre imagens editoriais para transformar esta seção em uma vitrine de marca pessoal."
          />
          <motion.div
            className="mt-14 grid gap-5 md:grid-cols-3"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {Array.from({ length: 3 }).map((_, index) => (
              <motion.div
                key={index}
                variants={reveal}
                className={cardClass(theme, 'grid h-72 place-items-center p-6 text-center shadow-[var(--preview-shadow)]')}
                style={{ borderRadius: theme.radius }}
              >
                <div>
                  <Sparkles size={38} className="mx-auto text-[var(--preview-primary)]" />
                  <p className="mt-4 font-extrabold">Imagem {index + 1}</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--preview-muted)]">
                    Espaço reservado para fotos do cliente.
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="galeria" className="bg-[var(--preview-bg)] py-28">
      <div className="section-shell">
        <SectionIntro
          eyebrow="Galeria"
          title="Um olhar editorial sobre a sua marca"
          description="Ambiente, detalhes e momentos apresentados com linguagem visual premium."
        />
        <motion.div
          className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {galleryItems.map((item, index) => (
            <GalleryCard key={`${item.title}-${index}`} item={item} theme={theme} index={index} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Sub-componente ───────────────────────────────────────────────────────────

function GalleryCard({ item, theme, index }) {
  const [failed, setFailed] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);
  const sources = useMemo(() => getImageCandidates(item.image_url || item.url), [item.image_url, item.url]);

  const CARD_LABELS = ['Story', 'Editorial', 'Reel'];

  return (
    <motion.article
      variants={reveal}
      className={cardClass(theme, 'group overflow-hidden p-3 shadow-[var(--preview-shadow)]')}
      style={{ borderRadius: theme.radius }}
      whileHover={{ y: -8, scale: 1.01 }}
    >
      <div
        className="relative aspect-[4/5] overflow-hidden bg-[var(--preview-card)]"
        style={{ borderRadius: `calc(${theme.radius} - 0.45rem)` }}
      >
        {sources.length && !failed ? (
          <img
            src={sources[sourceIndex]}
            alt={item.title || 'Galeria'}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
            onError={() => {
              if (sourceIndex < sources.length - 1) setSourceIndex((current) => current + 1);
              else setFailed(true);
            }}
          />
        ) : (
          <div className="grid h-full place-items-center text-[var(--preview-primary)]">
            <Sparkles size={42} />
          </div>
        )}
        <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/80 backdrop-blur-xl">
          {CARD_LABELS[index % 3]}
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 text-white">
          <div className="h-px w-14 bg-white/70" />
        </div>
      </div>
      {(item.title || item.description) && (
        <div className="px-2 pb-2 pt-4">
          {item.title && <h3 className="text-lg font-black tracking-[-0.015em]">{item.title}</h3>}
          {item.description && (
            <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-[var(--preview-muted)]">
              {item.description}
            </p>
          )}
        </div>
      )}
    </motion.article>
  );
}

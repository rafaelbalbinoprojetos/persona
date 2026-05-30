import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ImagePlus, Sparkles, Trash2 } from 'lucide-react';
import { cardClass } from './theme.js';
import { getImageCandidates } from './imageUtils.js';
import { normalizeGalleryItems } from './landingUtils.js';
import { SectionIntro, reveal, stagger } from './LandingShared.jsx';

export function GalleryModule({
  config,
  theme,
  editMode = false,
  onGalleryTextChange,
  onGalleryImageUpload,
  onRemoveGalleryItem,
}) {
  const { gallery } = config;
  const galleryItems = buildGalleryItems(gallery, editMode);

  if (!galleryItems.length) {
    return null;
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
            <GalleryCard
              key={index}
              item={item}
              theme={theme}
              index={index}
              editMode={editMode}
              onTextChange={onGalleryTextChange}
              onImageUpload={onGalleryImageUpload}
              onRemove={onRemoveGalleryItem}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Sub-componente ───────────────────────────────────────────────────────────

function GalleryCard({ item, theme, index, editMode = false, onTextChange, onImageUpload, onRemove }) {
  const [failed, setFailed] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);
  const sources = useMemo(() => getImageCandidates(item.image_url || item.url), [item.image_url, item.url]);

  const CARD_LABELS = ['Story', 'Editorial', 'Reel'];

  return (
    <motion.article
      variants={reveal}
      initial="hidden"
      animate="visible"
      className={cardClass(theme, 'group relative overflow-hidden p-3 shadow-[var(--preview-shadow)]')}
      style={{ borderRadius: theme.radius }}
      whileHover={{ y: -8, scale: 1.01 }}
    >
      {editMode && item.image_url && (
        <button
          type="button"
          onClick={() => onRemove?.(index)}
          className="absolute left-5 top-5 z-30 inline-flex h-10 items-center justify-center gap-2 rounded-full border border-red-200/70 bg-red-600/90 px-3 text-xs font-extrabold text-white shadow-2xl backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-red-700"
          aria-label="Excluir imagem da galeria"
        >
          <Trash2 size={15} />
          Excluir
        </button>
      )}
      <div
        className="relative aspect-[4/5] overflow-hidden bg-[var(--preview-card)]"
        style={{ borderRadius: `calc(${theme.radius} - 0.45rem)` }}
      >
        {editMode && <GalleryUploadButton onImageUpload={(file) => onImageUpload?.(index, file)} />}
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
          <div className="grid h-full place-items-center text-center text-[var(--preview-primary)]">
            <div>
              <Sparkles size={42} className="mx-auto" />
              <p className="mt-4 px-6 text-sm font-extrabold text-[var(--preview-muted)]">
                Imagem {index + 1}
              </p>
              <p className="mt-2 px-6 text-xs font-semibold text-[var(--preview-muted)]">
                Adicione uma foto para preencher este card.
              </p>
            </div>
          </div>
        )}
        <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/80 backdrop-blur-xl">
          {CARD_LABELS[index % 3]}
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 text-white">
          <div className="h-px w-14 bg-white/70" />
        </div>
      </div>
      <div className="px-2 pb-2 pt-4">
        {(item.title || editMode) && (
          <h3
            className={`rounded-xl text-lg font-black tracking-[-0.015em] outline-none ${
              editMode ? 'cursor-text ring-2 ring-transparent transition focus:bg-[var(--preview-surface)] focus:px-2 focus:py-1 focus:ring-[var(--preview-primary)]/25' : ''
            }`}
            contentEditable={editMode}
            suppressContentEditableWarning
            onBlur={(event) => onTextChange?.(index, 'title', event.currentTarget.textContent)}
          >
            {item.title || 'Título da imagem'}
          </h3>
        )}
        {(item.description || editMode) && (
          <p
            className={`mt-2 rounded-xl text-sm font-semibold leading-6 text-[var(--preview-muted)] outline-none ${
              editMode ? 'cursor-text ring-2 ring-transparent transition focus:bg-[var(--preview-surface)] focus:px-2 focus:py-1 focus:ring-[var(--preview-primary)]/25' : 'line-clamp-2'
            }`}
            contentEditable={editMode}
            suppressContentEditableWarning
            onBlur={(event) => onTextChange?.(index, 'description', event.currentTarget.textContent)}
          >
            {item.description || 'Descrição da imagem'}
          </p>
        )}
      </div>
    </motion.article>
  );
}

function GalleryUploadButton({ onImageUpload }) {
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

function buildGalleryItems(gallery, editMode) {
  const normalized = normalizeGalleryItems(gallery)
    .filter((item, index, list) => {
      if (editMode) return true;
      const source = item.image_url || item.url;
      return source && list.findIndex((candidate) => (candidate.image_url || candidate.url) === source) === index;
    })
    .slice(0, 6);

  if (normalized.length || !editMode) return normalized;

  return Array.from({ length: 3 }).map((_, index) => ({
    title: '',
    description: '',
    image_url: '',
    placeholder: true,
    index,
  }));
}

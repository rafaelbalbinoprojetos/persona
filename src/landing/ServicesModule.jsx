import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Clock3, ImagePlus, Plus, Trash2 } from 'lucide-react';
import { getImageCandidates, getUnsupportedImageReason } from './imageUtils.js';
import { getServicesIntroCopy } from './landingUtils.js';
import { SectionIntro, reveal, stagger } from './LandingShared.jsx';

export const SELECT_SERVICE_EVENT = 'persona:select-service';

/** Leva o visitante ao fluxo de conversão já com o serviço escolhido. */
export function selectServiceForBooking(serviceName, href = '#agenda') {
  if (serviceName) {
    window.dispatchEvent(new CustomEvent(SELECT_SERVICE_EVENT, { detail: { name: serviceName } }));
  }
  document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function ServicesModule({
  config,
  theme,
  editMode = false,
  bookingHref = '',
  onServiceTextChange,
  onServiceImageUpload,
  onAddService,
  onRemoveService,
}) {
  const { preset } = config;
  // Visitante: só serviços com nome. Dono: todos, preservando o índice do payload.
  const services = config.services
    .map((service, index) => ({ ...service, __index: index }))
    .filter((service) => editMode || String(service.name || '').trim());
  const copy = getServicesIntroCopy(config);
  const editorial = theme.key === 'dark-editorial';
  const rangeReservation = config.conversion?.calendarMode === 'date_range';
  const anyImage = services.some((service) => getImageCandidates(service.image_url).length > 0);
  const showImages = anyImage || editMode;

  if (!services.length && !editMode) return null;

  const gridCols =
    services.length === 1
      ? 'max-w-2xl'
      : services.length === 2 || services.length === 4
        ? 'md:grid-cols-2'
        : 'md:grid-cols-2 lg:grid-cols-3';

  const editable = (extra = '') =>
    editMode
      ? `cursor-text rounded-md outline-none ring-1 ring-transparent transition hover:ring-[var(--preview-primary)]/30 focus:ring-2 focus:ring-[var(--preview-primary)]/40 ${extra}`
      : extra;

  return (
    <section
      id="servicos"
      aria-labelledby="servicos-title"
      className={`${editorial ? 'bg-[#F8FAFC] text-slate-950' : 'bg-[var(--preview-bg)]'} py-14 sm:py-24`}
    >
      <div className="section-shell">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionIntro
            id="servicos-title"
            eyebrow={preset.sectionLabels.services}
            title={copy.title}
            description={copy.description}
            align="left"
            tone={editorial ? 'light' : 'default'}
          />
          {editMode && (
            <button
              type="button"
              onClick={onAddService}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-full border border-[var(--preview-border)] px-5 text-sm font-semibold text-[var(--preview-text)] transition hover:border-[var(--preview-primary)] hover:text-[var(--preview-primary)] md:self-auto"
            >
              <Plus size={16} aria-hidden="true" />
              Novo serviço
            </button>
          )}
        </div>

        {!services.length && editMode && (
          <div className="mt-10 rounded-xl border border-dashed border-[var(--preview-border)] p-8 text-center text-sm text-[var(--preview-muted)]">
            Nenhum serviço cadastrado. Visitantes não veem esta seção até você adicionar o primeiro.
          </div>
        )}

        {services.length > 0 && (
          <motion.ul
            className={`mt-8 grid sm:mt-12 gap-6 ${gridCols}`}
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            {services.map((service) => {
              const index = service.__index;
              const duration = Number(service.duration || service.duration_minutes) || 0;
              const price = String(service.price || '').trim();
              return (
                <motion.li
                  key={index}
                  data-service-index={index}
                  variants={reveal}
                  className={`group relative flex flex-col overflow-hidden border ${
                    editorial ? 'border-slate-200 bg-white' : 'border-[var(--preview-border)] bg-[var(--preview-surface)]'
                  } transition-shadow duration-300 hover:shadow-[var(--preview-shadow)]`}
                  style={{ borderRadius: theme.radius }}
                >
                  {editMode && (
                    <button
                      type="button"
                      onClick={() => onRemoveService?.(index)}
                      className="absolute left-3 top-3 z-20 inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-red-600 px-3 text-xs font-semibold text-white transition hover:bg-red-700"
                      aria-label={`Excluir serviço ${service.name}`}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                      Excluir
                    </button>
                  )}

                  {showImages && (
                    <ServiceImage
                      src={service.image_url}
                      alt={service.name}
                      editMode={editMode}
                      onImageUpload={(file) => onServiceImageUpload?.(index, file)}
                    />
                  )}

                  <div className="flex flex-1 flex-col p-6 sm:p-7">
                    <h3
                      className={editable('landing-display text-xl font-semibold leading-snug tracking-tight sm:text-[1.375rem]')}
                      contentEditable={editMode}
                      suppressContentEditableWarning
                      onBlur={(event) => onServiceTextChange?.(index, 'name', event.currentTarget.textContent)}
                    >
                      {service.name}
                    </h3>

                    {(service.subtitle || editMode) && (
                      <p
                        className={editable('mt-1.5 text-sm font-medium text-[var(--preview-primary)]')}
                        contentEditable={editMode}
                        suppressContentEditableWarning
                        data-placeholder="Subtítulo (opcional)"
                        onBlur={(event) => onServiceTextChange?.(index, 'subtitle', event.currentTarget.textContent)}
                      >
                        {service.subtitle || ''}
                      </p>
                    )}

                    {(service.description || editMode) && (
                      <p
                        className={editable(`mt-3 flex-1 text-[0.9375rem] leading-7 ${editorial ? 'text-slate-600' : 'text-[var(--preview-muted)]'}`)}
                        contentEditable={editMode}
                        suppressContentEditableWarning
                        data-placeholder="Descreva este serviço"
                        onBlur={(event) => onServiceTextChange?.(index, 'description', event.currentTarget.textContent)}
                      >
                        {service.description || ''}
                      </p>
                    )}

                    {((duration > 0 && !rangeReservation) || price || bookingHref) && (
                      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--preview-border)] pt-5 text-sm">
                        <div className="flex items-center gap-4 text-[var(--preview-muted)]">
                          {duration > 0 && !rangeReservation && (
                            <span className="inline-flex items-center gap-1.5">
                              <Clock3 size={15} aria-hidden="true" />
                              {duration} min
                            </span>
                          )}
                          {price && (
                            <span className="font-semibold text-[var(--preview-text)]">
                              {formatPrice(price)}
                            </span>
                          )}
                        </div>
                        {bookingHref && (
                          <a
                            href={bookingHref}
                            onClick={(event) => {
                              if (editMode) return;
                              event.preventDefault();
                              selectServiceForBooking(service.name, bookingHref);
                            }}
                            className="inline-flex items-center gap-1.5 font-semibold text-[var(--preview-primary)] transition-[gap] hover:gap-2.5"
                            aria-label={`${rangeReservation ? 'Consultar disponibilidade' : 'Agendar'}: ${service.name}`}
                          >
                            {rangeReservation ? 'Consultar disponibilidade' : 'Agendar'}
                            <ArrowRight size={15} aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </div>
    </section>
  );
}

function formatPrice(value) {
  const raw = String(value).trim();
  if (/[a-zA-Z$]/.test(raw)) return raw;
  return `A partir de R$ ${raw}`;
}

function ServiceImage({ src, alt, editMode = false, onImageUpload }) {
  const [failed, setFailed] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);
  const sources = useMemo(() => getImageCandidates(src), [src]);
  const unusable = Boolean(getUnsupportedImageReason(src)) || !sources.length || failed;

  if (unusable && !editMode) {
    // Sem foto: card só de texto, com um filete na cor da marca.
    return <span aria-hidden="true" className="block h-1 w-full bg-[var(--preview-primary)]" />;
  }

  return (
    <div className="relative aspect-[3/2] overflow-hidden bg-[var(--preview-card)]">
      {editMode && <ServiceImageUploadButton onImageUpload={onImageUpload} hasImage={!unusable} />}
      {unusable ? (
        <div className="grid h-full place-items-center text-xs text-[var(--preview-muted)]">Sem imagem</div>
      ) : (
        <img
          src={sources[sourceIndex]}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          onError={() => {
            if (sourceIndex < sources.length - 1) setSourceIndex((current) => current + 1);
            else setFailed(true);
          }}
        />
      )}
    </div>
  );
}

function ServiceImageUploadButton({ onImageUpload, hasImage = false }) {
  return (
    <label className="absolute right-3 top-3 z-20 inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-black/60 px-3 text-xs font-semibold text-white backdrop-blur transition hover:bg-black/75">
      <ImagePlus size={14} aria-hidden="true" />
      {hasImage ? 'Trocar' : 'Adicionar imagem'}
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

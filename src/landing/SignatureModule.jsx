import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { getImageCandidates } from './imageUtils.js';
import { SectionIntro, reveal, stagger } from './LandingShared.jsx';

/**
 * Equipe / profissional responsável.
 * Mostra apenas o que foi cadastrado: nome, especialidade, registro
 * profissional, apresentação e foto. Nada de pilares, anos de experiência
 * ou qualificações genéricas.
 */
export function hasTeamContent(config) {
  return (config.professionals || []).some(
    (person) => person.bio || person.photo_url || person.registration,
  );
}

export function SignatureModule({ config, theme, editMode = false, onProfessionalTextChange }) {
  const people = config.professionals || [];
  if (!hasTeamContent(config) && !editMode) return null;

  const list = people.length ? people : [{ name: config.business.name, specialty: '', registration: '', bio: '', photo_url: '' }];
  const editorial = theme.key === 'dark-editorial';
  const single = list.length === 1;
  const sectionLabel = config.preset.sectionLabels.professionals || 'Equipe';

  return (
    <section
      id="equipe"
      aria-labelledby="equipe-title"
      className={`${editorial ? 'bg-[#05070D]' : 'bg-[var(--preview-section)]'} py-14 sm:py-24`}
    >
      <div className="section-shell">
        {single ? (
          <SingleProfessional
            person={list[0]}
            label={sectionLabel}
            theme={theme}
            editMode={editMode}
            onProfessionalTextChange={onProfessionalTextChange}
          />
        ) : (
          <>
            <SectionIntro id="equipe-title" eyebrow={sectionLabel} title="Conheça a equipe" align="left" />
            <motion.ul
              className={`mt-6 grid gap-x-6 gap-y-5 sm:mt-12 sm:grid-cols-2 sm:gap-y-10 ${list.length >= 3 ? 'lg:grid-cols-3' : ''} ${list.length >= 4 ? 'xl:grid-cols-4' : ''}`}
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
            >
              {list.map((person, index) => (
                <motion.li
                  key={`${person.name}-${index}`}
                  variants={reveal}
                  className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-4 sm:block"
                >
                  {/* Celular: retrato compacto ao lado do texto. Tablet+: retrato 4:5. */}
                  <Portrait src={person.photo_url} name={person.name} theme={theme} className="aspect-[4/5]" />
                  <div>
                    <h3 className="landing-display text-base font-semibold tracking-tight sm:mt-5 sm:text-lg">{person.name}</h3>
                    <PersonMeta person={person} />
                    {person.bio && (
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--preview-muted)] sm:mt-3 sm:line-clamp-none">{person.bio}</p>
                    )}
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          </>
        )}
      </div>
    </section>
  );
}

function SingleProfessional({ person, label, theme, editMode, onProfessionalTextChange }) {
  const hasPhoto = getImageCandidates(person.photo_url).length > 0;
  const editable = (extra = '') =>
    editMode
      ? `cursor-text rounded-md outline-none ring-1 ring-transparent transition hover:ring-[var(--preview-primary)]/30 focus:ring-2 focus:ring-[var(--preview-primary)]/40 ${extra}`
      : extra;

  return (
    <motion.div
      className={`grid items-center gap-10 ${hasPhoto ? 'md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16' : ''}`}
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
    >
      {hasPhoto && (
        <motion.div variants={reveal} className="mx-auto w-full max-w-sm md:max-w-none">
          <Portrait src={person.photo_url} name={person.name} theme={theme} className="aspect-[4/5]" />
        </motion.div>
      )}
      <motion.div variants={reveal} className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--preview-primary)]">{label}</p>
        <h2 id="equipe-title" className="landing-display mt-3 text-[1.625rem] font-semibold leading-tight tracking-[-0.015em] sm:text-[2.5rem]">
          {person.name}
        </h2>
        <PersonMeta person={person} large />
        {(person.bio || editMode) && (
          <p
            className={editable('mt-6 text-base leading-8 text-[var(--preview-text-soft)] sm:text-lg')}
            contentEditable={editMode}
            suppressContentEditableWarning
            data-placeholder="Escreva uma apresentação do profissional ou da clínica"
            onBlur={(event) => onProfessionalTextChange?.('bio', event.currentTarget.textContent)}
          >
            {person.bio || ''}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}

function PersonMeta({ person, large = false }) {
  const parts = [person.specialty, person.registration].filter(Boolean);
  if (!parts.length) return null;
  return (
    <p className={`${large ? 'mt-3 text-base' : 'mt-1 text-sm'} text-[var(--preview-muted)]`}>
      {parts.join(' · ')}
    </p>
  );
}

function Portrait({ src, name, theme, className = '' }) {
  const sources = useMemo(() => getImageCandidates(src), [src]);
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  if (!sources.length || failed) {
    const initials = String(name || '')
      .split(/\s+/)
      .filter((part) => part.length > 2)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
    return (
      <div
        aria-hidden="true"
        className={`landing-display grid place-items-center bg-[var(--preview-card)] text-4xl font-semibold text-[var(--preview-primary)] ${className}`}
        style={{ borderRadius: theme.radius }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={sources[index]}
      alt={name ? `Foto de ${name}` : ''}
      loading="lazy"
      decoding="async"
      className={`w-full object-cover object-[center_25%] ${className}`}
      style={{ borderRadius: theme.radius }}
      onError={() => {
        if (index < sources.length - 1) setIndex((current) => current + 1);
        else setFailed(true);
      }}
    />
  );
}

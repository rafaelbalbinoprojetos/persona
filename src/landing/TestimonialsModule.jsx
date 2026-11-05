import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js';
import { getPublicTestimonialName, getTestimonialInitials } from './landingUtils.js';
import { reveal, SectionIntro, stagger } from './LandingShared.jsx';

/**
 * Depoimentos reais (tabela landing_testimonials, status ativo + autorizado).
 * Visitantes: sem depoimentos, a seção não existe.
 * Dono: vê um estado vazio com atalho para cadastrar.
 */
export function TestimonialsModule({ config, theme, editMode = false, onCountChange }) {
  const { submission, preset } = config;
  const [testimonials, setTestimonials] = useState([]);
  const [status, setStatus] = useState('loading');
  const editorial = theme.key === 'dark-editorial';

  useEffect(() => {
    let active = true;
    async function loadTestimonials() {
      if (!isSupabaseConfigured) { setStatus('empty'); onCountChange?.(0); return; }

      const { data, error } = await supabase
        .from('landing_testimonials')
        .select('id, customer_name, public_initials, photo_url, testimonial_text, rating, related_service, featured, created_at')
        .eq('submission_slug', submission.slug)
        .eq('status', 'active')
        .eq('authorized', true)
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (!active) return;
      const rows = error ? [] : data || [];
      setTestimonials(rows);
      setStatus(rows.length ? 'ready' : 'empty');
      onCountChange?.(rows.length);
    }
    loadTestimonials();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submission.slug]);

  if (status !== 'ready') {
    if (!editMode || status === 'loading') return null;
    return (
      <section id="depoimentos" className="bg-[var(--preview-bg)] py-16">
        <div className="section-shell">
          <div className="mx-auto max-w-2xl rounded-xl border border-dashed border-[var(--preview-border)] p-8 text-center">
            <p className="text-sm font-semibold text-[var(--preview-text)]">Depoimentos (visível só para você)</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--preview-muted)]">
              Nenhum depoimento ativo e autorizado. Visitantes não veem esta seção até você cadastrar um.
            </p>
            <a
              href={`/dashboard?slug=${encodeURIComponent(submission.slug)}&tab=testimonials`}
              className="mt-5 inline-flex h-10 items-center rounded-full border border-[var(--preview-border)] px-5 text-sm font-semibold text-[var(--preview-primary)] transition hover:border-[var(--preview-primary)]"
            >
              Cadastrar depoimento
            </a>
          </div>
        </div>
      </section>
    );
  }

  const columns =
    testimonials.length === 1 ? 'mx-auto max-w-2xl' : testimonials.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3';

  return (
    <section
      id="depoimentos"
      aria-labelledby="depoimentos-title"
      className={`${editorial ? 'bg-[#05070D]' : 'bg-[var(--preview-bg)]'} py-14 sm:py-24`}
    >
      <div className="section-shell">
        <SectionIntro id="depoimentos-title" eyebrow="Depoimentos" title="O que dizem sobre o atendimento" align="left" />
        <motion.ul
          className={`mt-8 grid sm:mt-12 gap-6 ${columns}`}
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {testimonials.map((testimonial) => {
            const rating = Math.max(0, Math.min(5, Math.round(Number(testimonial.rating) || 0)));
            const name = getPublicTestimonialName(testimonial, preset);
            return (
              <motion.li key={testimonial.id} variants={reveal}>
                <figure
                  className="flex h-full flex-col border border-[var(--preview-border)] bg-[var(--preview-surface)] p-6 sm:p-7"
                  style={{ borderRadius: theme.radius }}
                >
                  {rating > 0 && (
                    <div className="flex items-center gap-0.5 text-amber-500" role="img" aria-label={`Avaliação: ${rating} de 5`}>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} size={15} fill={index < rating ? 'currentColor' : 'none'} aria-hidden="true" />
                      ))}
                    </div>
                  )}
                  <blockquote className="mt-4 flex-1 text-base leading-7 text-[var(--preview-text)]">
                    “{testimonial.testimonial_text}”
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t border-[var(--preview-border)] pt-5">
                    <TestimonialAvatar testimonial={testimonial} name={name} theme={theme} />
                    <span>
                      <span className="block text-sm font-semibold">{name}</span>
                      {testimonial.related_service && (
                        <span className="block text-sm text-[var(--preview-muted)]">{testimonial.related_service}</span>
                      )}
                    </span>
                  </figcaption>
                </figure>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </section>
  );
}

function TestimonialAvatar({ testimonial, name, theme }) {
  const [failed, setFailed] = useState(false);
  const src = useMemo(() => testimonial.photo_url || '', [testimonial.photo_url]);
  const initials = getTestimonialInitials(testimonial);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={`Foto de ${name}`}
        loading="lazy"
        className="h-10 w-10 rounded-full object-cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="grid h-10 w-10 place-items-center rounded-full text-xs font-semibold text-white"
      style={{ backgroundColor: theme.secondary || theme.primary }}
    >
      {initials}
    </span>
  );
}

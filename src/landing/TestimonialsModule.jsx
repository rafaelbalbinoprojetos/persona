import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';
import { cardClass } from './theme.js';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js';
import { getPublicTestimonialName, getTestimonialInitials } from './landingUtils.js';
import { reveal, SectionIntro, stagger } from './LandingShared.jsx';

export function TestimonialsModule({ config, theme }) {
  const { submission, preset, services } = config;
  const [testimonials, setTestimonials] = useState([]);
  const [status, setStatus] = useState('loading');
  const editorial = theme.key === 'dark-editorial';

  useEffect(() => {
    async function loadTestimonials() {
      if (!isSupabaseConfigured) { setStatus('empty'); return; }

      const { data, error } = await supabase
        .from('landing_testimonials')
        .select('id, customer_name, public_initials, photo_url, testimonial_text, rating, related_service, featured, created_at')
        .eq('submission_slug', submission.slug)
        .eq('status', 'active')
        .eq('authorized', true)
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) { setStatus('empty'); return; }
      setTestimonials(data || []);
      setStatus(data?.length ? 'ready' : 'empty');
    }
    loadTestimonials();
  }, [submission.slug]);

  if (status !== 'ready') {
    return (
      <section id="depoimentos" className="bg-[var(--preview-bg)] py-24">
        <div className="section-shell">
          <SectionIntro
            eyebrow="Depoimentos"
            title="Depoimentos verificados"
            description="Os depoimentos ativos e autorizados pelo cliente aparecerão aqui automaticamente."
          />
          <div className="mx-auto mt-12 max-w-3xl">
            <div
              className={cardClass(theme, 'p-8 text-center shadow-[var(--preview-shadow)]')}
              style={{ borderRadius: theme.radius }}
            >
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--preview-surface)] text-[var(--preview-primary)]">
                <Quote size={26} />
              </div>
              <h3 className="mt-5 text-2xl font-extrabold">Nenhum depoimento publicado ainda</h3>
              <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-7 text-[var(--preview-muted)]">
                Cadastre depoimentos no dashboard, marque autorização de uso e defina o status como
                ativo para exibir cards reais nesta seção.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="depoimentos" className={`${editorial ? 'bg-[#05070D]' : 'bg-[var(--preview-bg)]'} py-24`}>
      <div className="section-shell">
        <SectionIntro
          eyebrow="Depoimentos"
          title="Experiências que reforçam confiança"
          description="Avaliações publicadas pelo cliente, com autorização de uso e controle de status."
        />
        <motion.div
          className={`mt-12 grid gap-6 ${testimonials.length === 1 ? 'mx-auto max-w-2xl' : 'lg:grid-cols-3'}`}
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {testimonials.map((testimonial) => (
            <motion.article
              key={testimonial.id}
              variants={reveal}
              className={cardClass(theme, 'group flex min-h-[320px] flex-col p-6 shadow-[var(--preview-shadow)] transition duration-300 hover:-translate-y-2')}
              style={{ borderRadius: theme.radius }}
            >
              <div className="flex items-start justify-between gap-4">
                <TestimonialAvatar testimonial={testimonial} theme={theme} fallbackLabel={preset.label} />
                <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--preview-surface)] text-[var(--preview-primary)]">
                  <Quote size={21} />
                </span>
              </div>
              <div className="mt-6 flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    size={17}
                    fill={index < Number(testimonial.rating || 5) ? 'currentColor' : 'none'}
                  />
                ))}
                <span className="ml-2 text-sm font-extrabold text-[var(--preview-text)]">
                  {Number(testimonial.rating || 5).toFixed(1)}
                </span>
              </div>
              <p className="mt-5 flex-1 text-lg font-semibold leading-8 text-[var(--preview-text)]">
                "{testimonial.testimonial_text}"
              </p>
              <div className="mt-6 border-t border-[var(--preview-border)] pt-5">
                <p className="font-extrabold">{getPublicTestimonialName(testimonial, preset)}</p>
                <p className="mt-1 text-sm font-bold text-[var(--preview-muted)]">
                  {testimonial.related_service || services[0]?.name || preset.label}
                </p>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Sub-componente ───────────────────────────────────────────────────────────

function TestimonialAvatar({ testimonial, theme, fallbackLabel }) {
  const [failed, setFailed] = useState(false);
  const sources = useMemo(() => {
    const src = testimonial.photo_url;
    return src ? [src] : [];
  }, [testimonial.photo_url]);
  const initials = getTestimonialInitials(testimonial);

  if (sources.length && !failed) {
    return (
      <img
        src={sources[0]}
        alt={getPublicTestimonialName(testimonial, { label: fallbackLabel })}
        className="h-16 w-16 rounded-full object-cover shadow-sm"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span
      className="grid h-16 w-16 place-items-center rounded-full text-lg font-extrabold text-white shadow-[var(--preview-glow)]"
      style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }}
    >
      {initials}
    </span>
  );
}

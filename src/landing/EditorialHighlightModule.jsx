import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { getImageCandidates } from './imageUtils.js';
import { isVenueVertical } from './landingUtils.js';
import { reveal, stagger } from './LandingShared.jsx';

export function EditorialHighlightModule({ config }) {
  const saved = config.editorialHighlight || {};
  const copy = getFallbackCopy(config);
  const imageUrl = saved.image_url || saved.imageUrl || config.gallery[0]?.image_url || config.gallery[0]?.url || config.branding.hero_image_url;
  const imageSources = getImageCandidates(imageUrl);
  const benefits = Array.isArray(saved.benefits) && saved.benefits.length ? saved.benefits.slice(0, 4) : copy.benefits;
  const galleryEnabled = config.enabledModules.gallery && config.gallery.some((item) => item.image_url || item.url);

  return (
    <section className="bg-[#F8FAFC] py-24 text-slate-950 sm:py-28">
      <div className="section-shell">
        <motion.div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}>
          <motion.div variants={reveal} className="relative min-h-[360px] overflow-hidden rounded-[1.75rem] bg-slate-200 shadow-[0_30px_70px_rgba(15,23,42,0.18)] sm:min-h-[520px]">
            {imageSources.length ? (
              <img src={imageSources[0]} alt={saved.title || copy.title} className="absolute inset-0 h-full w-full object-cover transition duration-700 hover:scale-105" />
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(135deg,#dbeafe,#e2e8f0_50%,#ede9fe)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
            <p className="absolute bottom-6 left-6 max-w-xs text-sm font-extrabold uppercase text-white/85">Detalhes que fazem diferença</p>
          </motion.div>

          <motion.div variants={reveal}>
            <p className="text-sm font-extrabold uppercase text-violet-700">{saved.eyebrow || copy.eyebrow}</p>
            <h2 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">{saved.title || copy.title}</h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">{saved.description || copy.description}</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <CheckCircle2 size={18} className="shrink-0 text-violet-600" />
                  <span className="text-sm font-extrabold text-slate-700">{benefit}</span>
                </div>
              ))}
            </div>
            <a href={galleryEnabled ? '#galeria' : '#agenda'} className="pill-button mt-9 bg-slate-950 text-white shadow-xl">
              {galleryEnabled ? 'Ver galeria' : 'Consultar disponibilidade'}
              <ArrowRight size={18} />
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function getFallbackCopy(config) {
  if (isVenueVertical(config.vertical)) {
    return {
      eyebrow: 'Ambientes e estrutura',
      title: 'Cada detalhe pensado para receber bem.',
      description: 'Conheça os ambientes, a estrutura e os diferenciais que tornam cada reserva mais simples, confortável e especial.',
      benefits: ['Conforto para grupos', 'Privacidade', 'Estrutura completa', 'Reserva facilitada'],
    };
  }
  return {
    eyebrow: 'Experiência em detalhes',
    title: 'Uma jornada pensada para transmitir confiança.',
    description: 'Apresente diferenciais, método e cuidado com uma composição visual mais humana, clara e memorável.',
    benefits: ['Atendimento próximo', 'Processo claro', 'Cuidado nos detalhes', 'Experiência premium'],
  };
}

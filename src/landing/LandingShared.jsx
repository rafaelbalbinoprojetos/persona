/** Primitivos de UI reutilizados entre os módulos da landing page. */

import { motion } from 'framer-motion';

export const cinematicEase = [0.22, 1, 0.36, 1];

export const reveal = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: cinematicEase } },
};

export const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

export function SectionIntro({ eyebrow, title, description, align = 'center', tone = 'default', id }) {
  return (
    <motion.div
      className={`max-w-3xl ${align === 'left' ? 'text-left' : 'mx-auto text-center'}`}
      variants={reveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
    >
      {eyebrow && (
        <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${tone === 'light' ? 'text-violet-700' : 'text-[var(--preview-primary)]'}`}>
          {eyebrow}
        </p>
      )}
      <h2 id={id} className="landing-display mt-2 text-[1.625rem] font-semibold leading-[1.15] sm:mt-3 tracking-[-0.015em] sm:text-[2.5rem] lg:text-[2.75rem]">
        {title}
      </h2>
      {description && (
        <p className={`mt-3 text-[0.9375rem] leading-6 sm:mt-4 sm:text-lg sm:leading-8 ${tone === 'light' ? 'text-slate-600' : 'text-[var(--preview-muted)]'}`}>{description}</p>
      )}
    </motion.div>
  );
}

export function AnimatedMesh() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute left-[-10rem] top-6 h-[34rem] w-[34rem] rounded-full bg-[var(--preview-primary)]/18 blur-3xl"
        animate={{ x: [0, 48, 0], y: [0, 24, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-12rem] right-[-8rem] h-[38rem] w-[38rem] rounded-full bg-[var(--preview-accent)]/14 blur-3xl"
        animate={{ x: [0, -36, 0], y: [0, -28, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

export function AtmosphericParticles() {
  const particles = [
    { left: '14%', top: '24%', size: 4, delay: 0 },
    { left: '28%', top: '72%', size: 3, delay: 1.2 },
    { left: '58%', top: '18%', size: 5, delay: 0.6 },
    { left: '76%', top: '58%', size: 3, delay: 1.8 },
    { left: '88%', top: '34%', size: 4, delay: 0.9 },
  ];

  return (
    <div className="pointer-events-none absolute inset-0">
      {particles.map((particle) => (
        <motion.span
          key={`${particle.left}-${particle.top}`}
          className="absolute rounded-full bg-white/45 shadow-[0_0_24px_rgba(255,255,255,0.35)]"
          style={{ left: particle.left, top: particle.top, width: particle.size, height: particle.size }}
          animate={{ y: [0, -18, 0], opacity: [0.12, 0.42, 0.12] }}
          transition={{ duration: 9, delay: particle.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

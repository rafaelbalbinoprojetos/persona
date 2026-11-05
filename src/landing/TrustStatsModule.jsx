import { motion } from 'framer-motion';
import { reveal, stagger } from './LandingShared.jsx';

/**
 * Indicadores cadastrados pelo cliente (payload.trustStats).
 * Sem valores de exemplo: se não houver indicadores reais, a seção não
 * é renderizada (a página decide isso antes de montar o módulo).
 */
export function TrustStatsModule({ config, theme }) {
  const stats = config.trustStats || [];
  if (!stats.length) return null;
  const editorial = theme?.key === 'dark-editorial';

  return (
    <section aria-label="Indicadores" className="border-y border-[var(--preview-border)] bg-[var(--preview-bg)]">
      <motion.dl
        className={`section-shell grid grid-cols-2 gap-y-8 py-10 sm:py-12 ${
          stats.length >= 4 ? 'lg:grid-cols-4' : stats.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
        }`}
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
      >
        {stats.map((stat, index) => (
          <motion.div
            key={`${stat.label}-${index}`}
            variants={reveal}
            className="flex flex-col-reverse gap-1 px-4 text-center sm:border-l sm:border-[var(--preview-border)] sm:first:border-l-0"
          >
            <dt className="text-sm text-[var(--preview-muted)]">{stat.label}</dt>
            <dd className={`landing-display text-3xl font-semibold tracking-tight sm:text-4xl ${editorial ? 'text-white' : 'text-[var(--preview-text)]'}`}>
              {stat.value}
            </dd>
          </motion.div>
        ))}
      </motion.dl>
    </section>
  );
}

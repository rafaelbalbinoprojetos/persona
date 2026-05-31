import { motion } from 'framer-motion';
import { CalendarCheck, Clock3, ShieldCheck, Sparkles, Star, UsersRound } from 'lucide-react';
import { reveal, stagger } from './LandingShared.jsx';

const ICONS = {
  calendar: CalendarCheck,
  clock: Clock3,
  shield: ShieldCheck,
  sparkles: Sparkles,
  star: Star,
  users: UsersRound,
};

export function TrustStatsModule({ config }) {
  const stats = config.trustStats.length ? config.trustStats : getFallbackStats(config.vertical);

  return (
    <section className="relative bg-[var(--preview-bg)] px-4 pb-8 sm:px-6 lg:px-8">
      <motion.div
        className="mx-auto grid max-w-[1380px] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(115deg,rgba(139,92,246,0.22),rgba(11,16,32,0.92)_46%,rgba(5,7,13,0.98))] shadow-[var(--preview-shadow)] backdrop-blur-2xl sm:grid-cols-2 lg:grid-cols-4"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
      >
        {stats.map((stat, index) => {
          const Icon = ICONS[stat.icon] || Sparkles;
          return (
            <motion.div key={`${stat.label}-${index}`} variants={reveal} className="border-white/10 p-6 sm:border-r lg:p-7">
              <div className="flex items-center gap-3 text-[var(--preview-accent)]">
                <Icon size={18} />
                <p className="text-xs font-extrabold uppercase">{stat.label}</p>
              </div>
              <p className="mt-4 text-4xl font-black text-white">{stat.value}</p>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}

function getFallbackStats(vertical) {
  if (vertical === 'venue') {
    return [
      { label: 'Reserva facilitada', value: 'Simples', icon: 'calendar' },
      { label: 'Experiência privativa', value: 'Premium', icon: 'shield' },
      { label: 'Atendimento direto', value: 'Ágil', icon: 'clock' },
      { label: 'Estrutura completa', value: 'Tudo pronto', icon: 'sparkles' },
    ];
  }
  if (vertical === 'technology') {
    return [
      { label: 'Diagnóstico objetivo', value: '360°', icon: 'sparkles' },
      { label: 'Processo estruturado', value: 'Claro', icon: 'shield' },
      { label: 'Atendimento próximo', value: 'Direto', icon: 'users' },
      { label: 'Foco em evolução', value: 'Escala', icon: 'star' },
    ];
  }
  return [
    { label: 'Atendimento personalizado', value: 'Próximo', icon: 'users' },
    { label: 'Experiência premium', value: 'Única', icon: 'star' },
    { label: 'Contato facilitado', value: 'Direto', icon: 'clock' },
    { label: 'Jornada clara', value: 'Segura', icon: 'shield' },
  ];
}

import { Brain, BriefcaseBusiness, Dumbbell, HeartPulse, Home, Scale, Smile, Sparkles, Stethoscope } from 'lucide-react';
import { getThemeByVertical } from './theme.js';

export const verticalPresets = {
  dental: {
    key: 'dental',
    label: 'Odontologia',
    recommendedTheme: 'clean-blue',
    tone: 'humano, limpo, acolhedor e tecnológico',
    Icon: Smile,
    sectionLabels: { services: 'Tratamentos', professionals: 'Especialistas', schedule: 'Agenda online' },
    heroFallback: {
      title: 'Cuidado moderno para você sorrir com confiança.',
      subtitle: 'Atendimento humanizado, tecnologia e uma experiência simples do primeiro contato ao acompanhamento.',
    },
    services: ['Clareamento', 'Implantes', 'Ortodontia', 'Limpeza preventiva'],
    professionalBio: 'Especialista dedicada a oferecer um atendimento cuidadoso, claro e orientado ao bem-estar do paciente.',
  },
  legal: {
    key: 'legal',
    label: 'Advocacia',
    recommendedTheme: 'dark-slate',
    tone: 'estratégico, sofisticado, seguro e corporativo',
    Icon: Scale,
    sectionLabels: { services: 'Áreas de atuação', professionals: 'Especialistas', schedule: 'Consulta estratégica' },
    heroFallback: {
      title: 'Estratégia jurídica com segurança e clareza.',
      subtitle: 'Atuação consultiva para proteger interesses, reduzir riscos e conduzir decisões importantes.',
    },
    services: ['Direito empresarial', 'Contratos', 'Trabalhista', 'Imobiliário'],
    professionalBio: 'Profissional com atuação consultiva, foco em estratégia e comunicação clara para cada etapa do caso.',
  },
  aesthetic: {
    key: 'aesthetic',
    label: 'Estética',
    recommendedTheme: 'warm-minimal',
    tone: 'premium, elegante, sensorial e aspiracional',
    Icon: Sparkles,
    sectionLabels: { services: 'Experiências', professionals: 'Equipe premium', schedule: 'Agendamento' },
    heroFallback: {
      title: 'Beleza, cuidado e tecnologia em uma experiência premium.',
      subtitle: 'Procedimentos personalizados para valorizar sua imagem com segurança, conforto e sofisticação.',
    },
    services: ['Limpeza de pele', 'Botox', 'Harmonização', 'Protocolos corporais'],
    professionalBio: 'Atendimento personalizado com foco em naturalidade, conforto e resultados consistentes.',
  },
  medical: {
    key: 'medical',
    label: 'Clínica médica',
    recommendedTheme: 'clean-blue',
    tone: 'confiável, técnico, humano e objetivo',
    Icon: Stethoscope,
    sectionLabels: { services: 'Especialidades', professionals: 'Corpo clínico', schedule: 'Marcar consulta' },
    heroFallback: {
      title: 'Saúde com cuidado, tecnologia e acompanhamento.',
      subtitle: 'Uma jornada clara para consultas, exames, orientações e acompanhamento personalizado.',
    },
    services: ['Consulta inicial', 'Check-up', 'Acompanhamento', 'Teleorientação'],
    professionalBio: 'Atendimento baseado em escuta, precisão técnica e orientação simples para o paciente.',
  },
  consulting: {
    key: 'consulting',
    label: 'Consultoria',
    recommendedTheme: 'dark-slate',
    tone: 'executivo, direto, analítico e confiável',
    Icon: BriefcaseBusiness,
    sectionLabels: { services: 'Soluções', professionals: 'Consultores', schedule: 'Diagnóstico' },
    heroFallback: {
      title: 'Decisões melhores com estratégia e método.',
      subtitle: 'Consultoria para organizar prioridades, estruturar crescimento e acelerar execução com clareza.',
    },
    services: ['Diagnóstico', 'Planejamento', 'Mentoria', 'Execução guiada'],
    professionalBio: 'Especialista em tradução de problemas complexos em planos claros, medidos e executáveis.',
  },
  fitness: {
    key: 'fitness',
    label: 'Fitness',
    recommendedTheme: 'dark-emerald',
    tone: 'energético, saudável, objetivo e motivador',
    Icon: Dumbbell,
    sectionLabels: { services: 'Programas', professionals: 'Treinadores', schedule: 'Agendar treino' },
    heroFallback: {
      title: 'Performance, saúde e acompanhamento de verdade.',
      subtitle: 'Programas personalizados para evoluir com segurança, consistência e suporte profissional.',
    },
    services: ['Avaliação física', 'Personal trainer', 'Treino funcional', 'Consultoria online'],
    professionalBio: 'Acompanhamento orientado por metas, técnica e evolução consistente.',
  },
  realEstate: {
    key: 'realEstate',
    label: 'Imobiliário',
    recommendedTheme: 'warm-minimal',
    tone: 'sofisticado, visual, consultivo e seguro',
    Icon: Home,
    sectionLabels: { services: 'Imóveis e serviços', professionals: 'Consultores', schedule: 'Visita ou consultoria' },
    heroFallback: {
      title: 'Encontre oportunidades com curadoria e segurança.',
      subtitle: 'Atendimento consultivo para compra, venda, locação e avaliação com processo claro.',
    },
    services: ['Compra assistida', 'Venda de imóveis', 'Avaliação', 'Locação'],
    professionalBio: 'Consultoria com leitura de mercado, curadoria e acompanhamento em cada decisão.',
  },
  venue: {
    key: 'venue',
    label: 'Espaços e reservas',
    recommendedTheme: 'warm-minimal',
    tone: 'visual, acolhedor, claro e experiencial',
    Icon: Home,
    sectionLabels: { services: 'Opções de reserva', professionals: 'Experiência', schedule: 'Reservar data' },
    heroFallback: {
      title: 'Um espaço preparado para viver bons momentos.',
      subtitle: 'Estrutura, conforto e reserva simples para fins de semana, eventos e encontros especiais.',
    },
    services: ['Fim de semana', 'Diária para eventos', 'Celebrações familiares', 'Reserva privativa'],
    professionalBio: 'Experiência pensada para receber pessoas com conforto, privacidade e uma jornada simples do interesse à reserva.',
  },
  wellness: {
    key: 'wellness',
    label: 'Bem-estar',
    recommendedTheme: 'soft-lilac',
    tone: 'calmo, acolhedor, humano e equilibrado',
    Icon: HeartPulse,
    sectionLabels: { services: 'Cuidados', professionals: 'Especialistas', schedule: 'Agendar horário' },
    heroFallback: {
      title: 'Cuidado integral para uma rotina mais leve.',
      subtitle: 'Experiências personalizadas para bem-estar, equilíbrio e acompanhamento próximo.',
    },
    services: ['Sessão inicial', 'Acompanhamento', 'Terapias', 'Programa personalizado'],
    professionalBio: 'Atendimento acolhedor e personalizado para construir uma jornada de cuidado consistente.',
  },
  technology: {
    key: 'technology',
    label: 'Tecnologia',
    recommendedTheme: 'dark-violet',
    tone: 'moderno, preciso, inovador e escalável',
    Icon: Brain,
    sectionLabels: { services: 'Soluções', professionals: 'Especialistas', schedule: 'Agendar diagnóstico' },
    heroFallback: {
      title: 'Tecnologia aplicada para acelerar resultados.',
      subtitle: 'Soluções digitais, automação e inteligência para transformar operações em vantagem competitiva.',
    },
    services: ['Diagnóstico digital', 'Automação', 'IA aplicada', 'Desenvolvimento'],
    professionalBio: 'Especialista em conectar tecnologia, produto e operação para gerar impacto mensurável.',
  },
};

export const defaultEnabledModules = {
  hero: true,
  trustStats: true,
  services: true,
  editorialHighlight: true,
  schedule: true,
  testimonials: false,
  faq: false,
  gallery: false,
  location: true,
  finalCta: true,
  footer: true,
};

export function detectVertical(segment = '') {
  const value = String(segment).toLowerCase();
  if (/odonto|dent|sorriso/.test(value)) return 'dental';
  if (/adv|jur|legal|direito|law|suit/.test(value)) return 'legal';
  if (/estet|beleza|beauty|spa/.test(value)) return 'aesthetic';
  if (/med|clin|saude|saúde/.test(value)) return 'medical';
  if (/consult|business|mentoria/.test(value)) return 'consulting';
  if (/fit|personal|academ|treino/.test(value)) return 'fitness';
  if (/sitio|sítio|chac|fazenda|temporada|hosped|pousada|loca|alug|reserva|evento|festa|salao|salão|quadra|estudio|estúdio/.test(value)) return 'venue';
  if (/imob|real|estate/.test(value)) return 'realEstate';
  if (/tech|ia|startup|software/.test(value)) return 'technology';
  if (/psico|terap|well|bem/.test(value)) return 'wellness';
  return 'dental';
}

export function getPresetByVertical(vertical) {
  return verticalPresets[vertical] || verticalPresets.dental;
}

export function generateFallbackHeroCopy(vertical) {
  return getPresetByVertical(vertical).heroFallback;
}

export function getSuggestedServices(vertical) {
  return getPresetByVertical(vertical).services;
}

export function getRecommendedThemeKey(vertical) {
  return getPresetByVertical(vertical).recommendedTheme || getThemeByVertical(vertical).key;
}

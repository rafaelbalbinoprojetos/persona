import { Brain, BriefcaseBusiness, Dumbbell, HeartPulse, Home, Scale, Smile, Sparkles, Stethoscope } from 'lucide-react';
import { getThemeByVertical } from './theme.js';

export const verticalPresets = {
  dental: {
    key: 'dental',
    label: 'Odontologia',
    recommendedTheme: 'clean-blue',
    tone: 'humano, limpo, acolhedor e tecnologico',
    Icon: Smile,
    sectionLabels: { services: 'Tratamentos', professionals: 'Especialistas', schedule: 'Agenda online' },
    heroFallback: {
      title: 'Cuidado moderno para voce sorrir com confianca.',
      subtitle: 'Atendimento humanizado, tecnologia e uma experiencia simples do primeiro contato ao acompanhamento.',
    },
    services: ['Clareamento', 'Implantes', 'Ortodontia', 'Limpeza preventiva'],
    professionalBio: 'Especialista dedicada a oferecer um atendimento cuidadoso, claro e orientado ao bem-estar do paciente.',
  },
  legal: {
    key: 'legal',
    label: 'Advocacia',
    recommendedTheme: 'dark-slate',
    tone: 'estrategico, sofisticado, seguro e corporativo',
    Icon: Scale,
    sectionLabels: { services: 'Areas de atuacao', professionals: 'Especialistas', schedule: 'Consulta estrategica' },
    heroFallback: {
      title: 'Estrategia juridica com seguranca e clareza.',
      subtitle: 'Atuacao consultiva para proteger interesses, reduzir riscos e conduzir decisoes importantes.',
    },
    services: ['Direito empresarial', 'Contratos', 'Trabalhista', 'Imobiliario'],
    professionalBio: 'Profissional com atuacao consultiva, foco em estrategia e comunicacao clara para cada etapa do caso.',
  },
  aesthetic: {
    key: 'aesthetic',
    label: 'Estetica',
    recommendedTheme: 'warm-minimal',
    tone: 'premium, elegante, sensorial e aspiracional',
    Icon: Sparkles,
    sectionLabels: { services: 'Experiencias', professionals: 'Equipe premium', schedule: 'Agendamento' },
    heroFallback: {
      title: 'Beleza, cuidado e tecnologia em uma experiencia premium.',
      subtitle: 'Procedimentos personalizados para valorizar sua imagem com seguranca, conforto e sofisticação.',
    },
    services: ['Limpeza de pele', 'Botox', 'Harmonizacao', 'Protocolos corporais'],
    professionalBio: 'Atendimento personalizado com foco em naturalidade, conforto e resultados consistentes.',
  },
  medical: {
    key: 'medical',
    label: 'Clinica medica',
    recommendedTheme: 'clean-blue',
    tone: 'confiavel, tecnico, humano e objetivo',
    Icon: Stethoscope,
    sectionLabels: { services: 'Especialidades', professionals: 'Corpo clinico', schedule: 'Marcar consulta' },
    heroFallback: {
      title: 'Saude com cuidado, tecnologia e acompanhamento.',
      subtitle: 'Uma jornada clara para consultas, exames, orientacoes e acompanhamento personalizado.',
    },
    services: ['Consulta inicial', 'Check-up', 'Acompanhamento', 'Teleorientacao'],
    professionalBio: 'Atendimento baseado em escuta, precisao tecnica e orientacao simples para o paciente.',
  },
  consulting: {
    key: 'consulting',
    label: 'Consultoria',
    recommendedTheme: 'dark-slate',
    tone: 'executivo, direto, analitico e confiavel',
    Icon: BriefcaseBusiness,
    sectionLabels: { services: 'Solucoes', professionals: 'Consultores', schedule: 'Diagnostico' },
    heroFallback: {
      title: 'Decisoes melhores com estrategia e metodo.',
      subtitle: 'Consultoria para organizar prioridades, estruturar crescimento e acelerar execucao com clareza.',
    },
    services: ['Diagnostico', 'Planejamento', 'Mentoria', 'Execucao guiada'],
    professionalBio: 'Especialista em traducao de problemas complexos em planos claros, medidos e executaveis.',
  },
  fitness: {
    key: 'fitness',
    label: 'Fitness',
    recommendedTheme: 'dark-emerald',
    tone: 'energetico, saudavel, objetivo e motivador',
    Icon: Dumbbell,
    sectionLabels: { services: 'Programas', professionals: 'Treinadores', schedule: 'Agendar treino' },
    heroFallback: {
      title: 'Performance, saude e acompanhamento de verdade.',
      subtitle: 'Programas personalizados para evoluir com seguranca, consistencia e suporte profissional.',
    },
    services: ['Avaliacao fisica', 'Personal trainer', 'Treino funcional', 'Consultoria online'],
    professionalBio: 'Acompanhamento orientado por metas, tecnica e evolucao consistente.',
  },
  realEstate: {
    key: 'realEstate',
    label: 'Imobiliario',
    recommendedTheme: 'warm-minimal',
    tone: 'sofisticado, visual, consultivo e seguro',
    Icon: Home,
    sectionLabels: { services: 'Imoveis e servicos', professionals: 'Consultores', schedule: 'Visita ou consultoria' },
    heroFallback: {
      title: 'Encontre oportunidades com curadoria e seguranca.',
      subtitle: 'Atendimento consultivo para compra, venda, locacao e avaliacao com processo claro.',
    },
    services: ['Compra assistida', 'Venda de imoveis', 'Avaliacao', 'Locacao'],
    professionalBio: 'Consultoria com leitura de mercado, curadoria e acompanhamento em cada decisao.',
  },
  wellness: {
    key: 'wellness',
    label: 'Bem-estar',
    recommendedTheme: 'soft-lilac',
    tone: 'calmo, acolhedor, humano e equilibrado',
    Icon: HeartPulse,
    sectionLabels: { services: 'Cuidados', professionals: 'Especialistas', schedule: 'Agendar horario' },
    heroFallback: {
      title: 'Cuidado integral para uma rotina mais leve.',
      subtitle: 'Experiencias personalizadas para bem-estar, equilibrio e acompanhamento proximo.',
    },
    services: ['Sessao inicial', 'Acompanhamento', 'Terapias', 'Programa personalizado'],
    professionalBio: 'Atendimento acolhedor e personalizado para construir uma jornada de cuidado consistente.',
  },
  technology: {
    key: 'technology',
    label: 'Tecnologia',
    recommendedTheme: 'dark-violet',
    tone: 'moderno, preciso, inovador e escalavel',
    Icon: Brain,
    sectionLabels: { services: 'Solucoes', professionals: 'Especialistas', schedule: 'Agendar diagnostico' },
    heroFallback: {
      title: 'Tecnologia aplicada para acelerar resultados.',
      subtitle: 'Solucoes digitais, automacao e inteligencia para transformar operacoes em vantagem competitiva.',
    },
    services: ['Diagnostico digital', 'Automacao', 'IA aplicada', 'Desenvolvimento'],
    professionalBio: 'Especialista em conectar tecnologia, produto e operacao para gerar impacto mensuravel.',
  },
};

export const defaultEnabledModules = {
  hero: true,
  services: true,
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

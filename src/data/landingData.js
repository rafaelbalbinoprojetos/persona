import {
  BadgeCheck,
  BellRing,
  CalendarCheck,
  HeartHandshake,
  Hospital,
  Medal,
  ShieldCheck,
  SmilePlus,
  Sparkles,
  Stethoscope,
  Syringe,
  UserRoundCheck,
  WandSparkles,
} from 'lucide-react';

export const clinic = {
  name: 'PersonaPro',
  tagline: 'Odontologia premium com agenda inteligente',
  phone: '(11) 99876-4321',
  whatsapp: '(11) 99876-4321',
  email: 'contato@sorrisopro.com.br',
  address: 'Av. Paulista, 1000 - Bela Vista, Sao Paulo',
  socials: ['Instagram', 'LinkedIn', 'Facebook'],
};

export const navItems = [
  { label: 'Servicos', href: '#servicos' },
  { label: 'Agenda', href: '#agenda' },
  { label: 'Equipe', href: '#equipe' },
  { label: 'FAQ', href: '#faq' },
];

export const heroStats = [
  { label: 'pacientes acompanhados', value: '12k+' },
  { label: 'avaliacao media', value: '4.9/5' },
  { label: 'consultas no mes', value: '860+' },
];

export const floatingCards = [
  {
    title: 'Agenda disponivel',
    detail: 'Hoje, 15:30',
    Icon: CalendarCheck,
    tone: 'bg-brand-50 text-brand-700',
  },
  {
    title: 'Clinica verificada',
    detail: 'Equipe certificada',
    Icon: ShieldCheck,
    tone: 'bg-mint-50 text-mint-500',
  },
  {
    title: 'Avaliacao',
    detail: '4.9 por 2.184 pacientes',
    Icon: Sparkles,
    tone: 'bg-lilac-50 text-lilac-600',
  },
];

export const services = [
  {
    title: 'Clareamento dental',
    description: 'Protocolos seguros para um sorriso mais claro, natural e uniforme.',
    Icon: WandSparkles,
  },
  {
    title: 'Implantes',
    description: 'Planejamento digital para reabilitacao oral com conforto e precisao.',
    Icon: SmilePlus,
  },
  {
    title: 'Ortodontia',
    description: 'Alinhadores e aparelhos com acompanhamento proximo da evolucao.',
    Icon: BadgeCheck,
  },
  {
    title: 'Limpeza',
    description: 'Profilaxia completa para prevencao, brilho e saude gengival.',
    Icon: Sparkles,
  },
  {
    title: 'Restauracoes',
    description: 'Tecnicas esteticas para recuperar funcao e preservar o dente.',
    Icon: Syringe,
  },
  {
    title: 'Avaliacao preventiva',
    description: 'Checkups inteligentes para detectar necessidades antes da urgencia.',
    Icon: Stethoscope,
  },
];

export const benefits = [
  { title: 'Atendimento humanizado', description: 'Fluxo acolhedor do primeiro contato ao pos-consulta.', Icon: HeartHandshake },
  { title: 'Agendamento online', description: 'Horarios, profissionais e servicos em poucos cliques.', Icon: CalendarCheck },
  { title: 'Profissionais especializados', description: 'Equipe multidisciplinar com historico centralizado.', Icon: Medal },
  { title: 'Ambiente moderno', description: 'Clinica planejada para conforto, privacidade e tecnologia.', Icon: Hospital },
  { title: 'Lembretes automaticos', description: 'Confirmacoes por WhatsApp, e-mail e notificacoes.', Icon: BellRing },
  { title: 'Acompanhamento personalizado', description: 'Plano de tratamento visivel e atualizado a cada etapa.', Icon: UserRoundCheck },
];

export const scheduleOptions = {
  services: ['Clareamento dental', 'Limpeza preventiva', 'Implante', 'Ortodontia'],
  professionals: ['Dra. Marina Costa', 'Dr. Rafael Nogueira', 'Dra. Bianca Lima'],
  times: ['09:00', '10:30', '14:00', '15:30', '17:00'],
};

export const dentists = [
  {
    name: 'Dra. Marina Costa',
    specialty: 'Estetica dental e harmonizacao do sorriso',
    experience: '12 anos de experiencia',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=900&q=85',
  },
  {
    name: 'Dr. Rafael Nogueira',
    specialty: 'Implantodontia e planejamento digital',
    experience: '9 anos de experiencia',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=900&q=85',
  },
  {
    name: 'Dra. Bianca Lima',
    specialty: 'Ortodontia, alinhadores e cuidado preventivo',
    experience: '8 anos de experiencia',
    image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=900&q=85',
  },
];

export const testimonials = [
  {
    name: 'Camila Torres',
    role: 'Paciente de clareamento',
    quote: 'O agendamento foi simples e a equipe explicou tudo com muita clareza. A experiencia passa confianca desde o primeiro contato.',
  },
  {
    name: 'Andre Martins',
    role: 'Tratamento com implante',
    quote: 'Acompanhei cada etapa pelo plano digital e recebi lembretes antes das consultas. Foi organizado, moderno e acolhedor.',
  },
  {
    name: 'Juliana Prado',
    role: 'Ortodontia',
    quote: 'Gostei da comunicacao e do cuidado nos detalhes. A clinica tem uma estrutura excelente e o atendimento e muito humano.',
  },
];

export const faqs = [
  {
    question: 'Consigo agendar minha primeira avaliacao online?',
    answer: 'Sim. A plataforma permite escolher servico, profissional, data e horario disponivel para confirmar a avaliacao.',
  },
  {
    question: 'A PersonaPro envia lembretes de consulta?',
    answer: 'Sim. Os lembretes podem ser enviados por WhatsApp, e-mail e notificacoes conforme a preferencia do paciente.',
  },
  {
    question: 'Os planos de tratamento ficam salvos?',
    answer: 'Sim. O historico do paciente, etapas do tratamento e proximas consultas podem ser centralizados para acompanhamento.',
  },
  {
    question: 'A landing page esta pronta para integrar banco de dados?',
    answer: 'Os conteudos foram estruturados em arrays mockados, facilitando a troca futura por dados vindos de uma API ou CMS.',
  },
];

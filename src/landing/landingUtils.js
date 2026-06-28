import { Facebook, Globe, Instagram, Linkedin, Music2, Youtube } from 'lucide-react';

/** Retorna o profissional principal da config com fallbacks garantidos. */
export function getFeaturedProfessional(config) {
  const professional = config.professionals?.[0] || {};
  return {
    name: professional.name || config.business.name,
    specialty: professional.specialty || config.preset.label,
    photo_url: professional.photo_url || config.branding.hero_image_url,
    bio: professional.bio || config.preset.professionalBio,
  };
}

/** Monta a lista de redes sociais ativas com URLs normalizadas. */
export function getSocialLinks(config) {
  const business = config.business || {};
  const socials = business.socials || config.submission?.payload?.socials || {};

  const candidates = [
    { label: 'Instagram', href: business.instagram_url || socials.instagram || socials.instagram_url, Icon: Instagram },
    { label: 'TikTok', href: business.tiktok_url || socials.tiktok || socials.tiktok_url, Icon: Music2 },
    { label: 'LinkedIn', href: business.linkedin_url || socials.linkedin || socials.linkedin_url, Icon: Linkedin },
    { label: 'Facebook', href: business.facebook_url || socials.facebook || socials.facebook_url, Icon: Facebook },
    { label: 'YouTube', href: business.youtube_url || socials.youtube || socials.youtube_url, Icon: Youtube },
    { label: 'Site', href: business.website_url || socials.website || socials.website_url, Icon: Globe },
  ];

  return candidates
    .filter((item) => item.href)
    .map((item) => ({
      ...item,
      href: normalizeSocialUrl(item.href, item.label),
      handle: getSocialHandle(item.href, item.label),
    }));
}

export function isVenueVertical(vertical) {
  return vertical === 'venue';
}

export function getHeroMicrocopy(config) {
  const isVenue = isVenueVertical(config.vertical);
  return {
    eyebrow: isVenue ? 'Espaço para reserva' : (config.preset?.label || 'Atendimento profissional'),
    primaryCta: isVenue ? 'Reservar agora' : 'Agendar agora',
    secondaryCta: isVenue ? 'Conhecer o espaço' : 'Conhecer os serviços',
    trustTitle: isVenue ? 'Reserva facilitada' : 'Presença verificada',
    countLabel: isVenue ? 'opções de reserva' : `${(config.preset?.sectionLabels?.services || 'serviços').toLowerCase()} disponíveis`,
    socialTitle: isVenue ? 'Canal oficial ativo' : 'Presença digital ativa',
    availabilitySubtitle: isVenue ? 'Próxima data disponível' : 'Próxima disponibilidade',
  };
}

export function getServicesIntroCopy(config) {
  if (isVenueVertical(config.vertical)) {
    return {
      title: 'Opções para reservar o espaço',
      description: 'Apresente usos, datas e formatos de reserva com clareza para transformar interesse em pedidos reais.',
      cardPrefix: 'Opção',
      durationSuffix: 'min',
      emptyDescription: `Uma opção de reserva pronta para personalização em ${config.preset.label.toLowerCase()}.`,
    };
  }

  return {
    title: 'Conheça nossos serviços',
    description: 'Escolha o que você precisa e agende em poucos cliques.',
    cardPrefix: 'Serviço',
    durationSuffix: 'min',
    emptyDescription: 'Saiba mais e agende este serviço.',
  };
}

export function getSignatureIntroCopy(config) {
  if (isVenueVertical(config.vertical)) {
    return {
      eyebrow: 'Experiência do espaço',
      title: 'Estrutura pensada para receber bem em cada reserva.',
    };
  }

  return {
    eyebrow: 'Nosso atendimento',
    title: 'Uma forma própria de atender, orientar e transformar.',
  };
}

export function getFooterCopy(config) {
  if (isVenueVertical(config.vertical)) {
    return {
      description: 'Espaço com reserva simples, apresentação clara e experiência pensada para bons momentos.',
      contactFallback: 'Reserva, localização e contato reunidos em uma experiência direta.',
      servicesTitle: 'Reservas',
      exploreServicesLabel: 'Reservas',
    };
  }

  return {
    description: `${config.preset.label} com atendimento de qualidade e agendamento online.`,
    contactFallback: 'Atendimento, localização e contato em um só lugar.',
    servicesTitle: config.preset.sectionLabels.services,
    exploreServicesLabel: config.preset.sectionLabels.services,
  };
}

export function getScheduleCopy(config) {
  if (isVenueVertical(config.vertical)) {
    return {
      title: 'Escolha a data da reserva',
      description: 'Consulte dias disponíveis, bloqueios e horários cadastrados para solicitar sua reserva.',
      unavailable: 'Sem reserva',
      noServiceDate: 'Não haverá reserva nesta data.',
      noTimes: 'Nenhum horário configurado para este dia.',
      reasonLabel: 'Detalhes da reserva',
      reasonPlaceholder: 'Ex: fim de semana, aniversário, quantidade de pessoas',
      savingLabel: 'Cadastrando reserva...',
      buttonLabel: 'Solicitar reserva',
      successMessage: 'Reserva solicitada com sucesso. Em breve enviaremos a confirmação.',
      invalidFallback: 'Revise os dados para solicitar a reserva.',
      noRuleMessage: 'Escolha uma data com reserva disponível.',
      blockedMessage: 'Esta data está bloqueada para reserva.',
    };
  }

  return {
    title: 'Escolha uma data e horário disponível',
    description: 'O calendário respeita horários, pausas, bloqueios e agendamentos já cadastrados.',
    unavailable: 'Sem atendimento',
    noServiceDate: 'Não haverá atendimento nesta data.',
    noTimes: 'Nenhum horário configurado para este dia.',
    reasonLabel: 'Motivo do agendamento',
    reasonPlaceholder: 'Ex: avaliação, retorno, consulta inicial',
    savingLabel: 'Cadastrando agendamento...',
    buttonLabel: 'Solicitar agendamento',
    successMessage: 'Agendamento solicitado com sucesso. Em breve enviaremos a confirmação.',
    invalidFallback: 'Revise os dados para solicitar o agendamento.',
    noRuleMessage: 'Escolha uma data com atendimento disponível.',
    blockedMessage: 'Esta data está bloqueada para atendimento.',
  };
}

function normalizeSocialUrl(value, label) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('@') && label === 'Instagram') return `https://instagram.com/${raw.slice(1)}`;
  if (raw.startsWith('@') && label === 'TikTok') return `https://tiktok.com/${raw}`;
  if (label === 'Instagram' && !raw.includes('.')) return `https://instagram.com/${raw.replace(/^@/, '')}`;
  if (label === 'TikTok' && !raw.includes('.')) return `https://tiktok.com/@${raw.replace(/^@/, '')}`;
  return `https://${raw}`;
}

function getSocialHandle(value, label) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('@')) return raw;
  if (label === 'Instagram') {
    const match = raw.match(/instagram\.com\/([^/?#]+)/i);
    return match ? `@${match[1]}` : raw.includes('.') ? label : `@${raw}`;
  }
  if (label === 'TikTok') {
    const match = raw.match(/tiktok\.com\/@?([^/?#]+)/i);
    return match ? `@${match[1]}` : raw.includes('.') ? label : `@${raw.replace(/^@/, '')}`;
  }
  return label;
}

/** Linhas emocionais por vertical para os cards de serviço. */
export function getServiceEmotionalLine(vertical, index) {
  const lines = {
    dental: ['Precisão estética', 'Conforto em cada etapa', 'Cuidado com naturalidade'],
    legal: ['Estratégia sob medida', 'Segurança para decidir', 'Clareza em cada movimento'],
    aesthetic: ['Naturalidade premium', 'Cuidado sensorial', 'Resultado com elegância'],
    medical: ['Escuta qualificada', 'Cuidado com método', 'Acompanhamento claro'],
    consulting: ['Método e direção', 'Decisões com clareza', 'Execução com foco'],
    fitness: ['Performance consciente', 'Evolução acompanhada', 'Consistência real'],
    wellness: ['Presença e acolhimento', 'Equilíbrio personalizado', 'Ritual de cuidado'],
    venue: ['Conforto para reunir', 'Reserva sem atrito', 'Estrutura para aproveitar'],
  };
  const list = lines[vertical] || ['Experiência personalizada', 'Atendimento autoral', 'Cuidado premium'];
  return list[index % list.length];
}

/** Pilares da seção Assinatura por vertical. */
export function getSignaturePillars(vertical) {
  const pillars = {
    dental: ['Estética', 'Confiança', 'Tecnologia'],
    legal: ['Estratégia', 'Segurança', 'Clareza'],
    aesthetic: ['Naturalidade', 'Cuidado', 'Sofisticação'],
    medical: ['Precisão', 'Escuta', 'Acompanhamento'],
    consulting: ['Método', 'Direção', 'Resultado'],
    fitness: ['Performance', 'Técnica', 'Constância'],
    wellness: ['Presença', 'Equilíbrio', 'Acolhimento'],
    technology: ['Inovação', 'Método', 'Escala'],
    venue: ['Conforto', 'Privacidade', 'Reserva'],
  };
  return pillars[vertical] || ['Presença', 'Método', 'Experiência'];
}

/** Nome público do depoimento com fallback por nicho. */
export function getPublicTestimonialName(testimonial, preset) {
  return (
    testimonial.customer_name?.trim()
    || testimonial.public_initials?.trim()
    || (preset?.label === 'Odontologia' ? 'Paciente verificado' : 'Cliente verificado')
  );
}

/** Iniciais para o avatar do depoimento. */
export function getTestimonialInitials(testimonial) {
  const source = testimonial.public_initials || testimonial.customer_name || 'CV';
  return (
    String(source)
      .trim()
      .split(/\s+/)
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'CV'
  );
}

/** Normaliza itens de galeria para o formato canônico. */
export function normalizeGalleryItems(items = []) {
  return items.map((item) => ({
    title: item.title || item.name || 'Imagem institucional',
    description: item.description || item.alt_text || '',
    image_url: item.image_url || item.url || item.photo_url || '',
  }));
}

/** Gera FAQs padrão quando não há dados cadastrados. */
export function normalizeFaqs(items = [], config) {
  if (items.length) {
    return items.map((item) => ({
      question: item.question || item.title || 'Pergunta frequente',
      answer: item.answer || item.description || 'Resposta personalizada carregada do cadastro.',
    }));
  }

  const serviceLabel = config.preset.sectionLabels.services.toLowerCase();
  const scheduleLabel = config.preset.sectionLabels.schedule.toLowerCase();
  if (isVenueVertical(config.vertical)) {
    return [
      {
        question: 'Como funciona a reserva?',
        answer: 'Você escolhe a data desejada, envia os detalhes principais e recebe o retorno para confirmação de disponibilidade.',
      },
      {
        question: 'Quais opções de reserva estão disponíveis?',
        answer: 'A página apresenta os principais formatos cadastrados para o espaço, como fim de semana, diária ou eventos.',
      },
      {
        question: 'Como recebo a confirmação?',
        answer: 'A solicitação fica registrada para acompanhamento e confirmação dos próximos passos da reserva.',
      },
    ];
  }

  return [
    {
      question: `Como funciona o ${scheduleLabel}?`,
      answer: 'Você escolhe uma data e horário disponível na agenda online e envia a solicitação em poucos segundos.',
    },
    {
      question: `Quais ${serviceLabel} estão disponíveis?`,
      answer: `A página apresenta os principais ${serviceLabel} cadastrados pelo profissional, com tempo, descrição e valor quando informado.`,
    },
    {
      question: 'Como recebo a confirmação?',
      answer: 'A solicitação fica registrada no sistema para que o profissional acompanhe e confirme o atendimento.',
    },
  ];
}

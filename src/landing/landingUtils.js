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

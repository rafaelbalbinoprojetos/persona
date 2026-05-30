const appointmentSegments = ['dent', 'odonto', 'barb', 'cabel', 'estetic', 'psicol', 'fisio', 'personal', 'sitio', 'sítio', 'chacara', 'chácara', 'loca', 'alug', 'reserva', 'hosped', 'temporada', 'evento', 'salao', 'salão', 'quadra', 'estudio', 'estúdio'];
const requestSegments = ['sistema', 'software', 'design', 'arquitet', 'marketing', 'fotograf'];
const consultationSegments = ['advog', 'jurid', 'consult', 'mentor', 'contador', 'empresa'];

const weekdayMap = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

export function normalizePersonaPayload(raw = {}) {
  const business = raw.business || {};
  const branding = raw.branding || {};
  const conversion = raw.conversion || {};
  const schedule = raw.schedule || {};
  const social = raw.social || {};
  const finalCta = raw.finalCta || {};
  const segment = cleanText(business.segment || branding.specialty || 'servicos');
  const mode = normalizeConversionMode(conversion.mode, segment);
  const businessName = cleanText(business.name || branding.professionalName || 'Profissional Persona');

  return {
    business: {
      name: businessName,
      slug: slugify(business.slug || businessName),
      segment,
      whatsapp: onlyPhoneDigits(business.whatsapp || ''),
      email: cleanText(business.email || ''),
      address: cleanText(business.address || ''),
      status: 'trial',
    },
    branding: {
      professionalName: cleanText(branding.professionalName || businessName),
      specialty: cleanText(branding.specialty || segment),
      heroTitle: cleanText(branding.heroTitle || `Uma presença premium para ${businessName}`),
      heroSubtitle: cleanText(branding.heroSubtitle || 'Uma experiência profissional clara, elegante e feita para gerar confiança desde o primeiro contato.'),
      heroBadge: cleanText(branding.heroBadge || branding.specialty || segment),
      primaryColor: normalizeColor(branding.primaryColor || business.primaryColor || '#2563eb'),
      themeKey: cleanText(branding.themeKey || getThemeByVertical(segment)),
      heroImageUrl: cleanUrl(branding.heroImageUrl || ''),
      ctaPrimary: cleanText(branding.ctaPrimary || defaultButtonLabel(mode)),
      ctaSecondary: cleanText(branding.ctaSecondary || 'Conhecer assinatura profissional'),
      tone: cleanText(branding.tone || 'premium, claro e autoral'),
      positioning: cleanText(branding.positioning || ''),
      signatureTitle: cleanText(branding.signatureTitle || 'Assinatura profissional'),
      signatureText: cleanText(branding.signatureText || 'Um atendimento conduzido com método, presença e atenção aos detalhes que tornam cada etapa mais clara e segura.'),
      signatureTags: normalizeStringArray(branding.signatureTags).slice(0, 4),
    },
    services: normalizeServices(raw.services, segment),
    conversion: {
      mode,
      title: cleanText(conversion.title || defaultConversionCopy(mode).title),
      subtitle: cleanText(conversion.subtitle || defaultConversionCopy(mode).subtitle),
      buttonLabel: cleanText(conversion.buttonLabel || defaultConversionCopy(mode).buttonLabel),
      successMessage: cleanText(conversion.successMessage || defaultConversionCopy(mode).successMessage),
      showSchedule: mode === 'appointment' || Boolean(conversion.showSchedule),
      requestServiceTypes: normalizeStringArray(conversion.requestServiceTypes),
    },
    schedule: {
      enabled: schedule.enabled !== false,
      days: normalizeScheduleDays(schedule.days),
      startTime: normalizeTime(schedule.startTime, '08:00'),
      endTime: normalizeTime(schedule.endTime, '18:00'),
      intervalMinutes: Number(schedule.intervalMinutes) || 30,
      breaks: normalizeBreaks(schedule.breaks),
    },
    faq: normalizeFaq(raw.faq),
    social: {
      instagram: cleanText(social.instagram || ''),
      tiktok: cleanText(social.tiktok || ''),
      linkedin: cleanText(social.linkedin || ''),
      facebook: cleanText(social.facebook || ''),
      youtube: cleanText(social.youtube || ''),
      website: cleanText(social.website || ''),
    },
    finalCta: {
      title: cleanText(finalCta.title || 'Pronto para dar o próximo passo?'),
      subtitle: cleanText(finalCta.subtitle || `Fale com ${branding.professionalName || businessName} e comece com uma experiência profissional mais clara.`),
      buttonLabel: cleanText(finalCta.buttonLabel || defaultButtonLabel(mode)),
    },
  };
}

export function validatePersonaPayload(payload) {
  const errors = [];
  if (!payload?.business?.name) errors.push('Nome do profissional ou negócio ausente.');
  if (!payload?.business?.slug) errors.push('Slug sugerido ausente.');
  if (!payload?.branding?.heroTitle) errors.push('Título da hero ausente.');
  if (!Array.isArray(payload?.services) || !payload.services.length) errors.push('Nenhum serviço sugerido.');
  if (!['appointment', 'request', 'consultation', 'lead'].includes(payload?.conversion?.mode)) {
    errors.push('Modo de atendimento inválido.');
  }
  return { valid: errors.length === 0, errors };
}

export function mergePersonaWithDefaults(persona, defaults = {}) {
  const normalized = normalizePersonaPayload(persona);
  const firstService = normalized.services.length ? normalized.services : defaults.services;

  return {
    ...defaults,
    businessName: normalized.business.name || defaults.businessName,
    slug: normalized.business.slug || defaults.slug,
    segment: normalized.business.segment || defaults.segment,
    whatsapp: normalized.business.whatsapp || defaults.whatsapp,
    email: normalized.business.email || defaults.email,
    address: normalized.business.address || defaults.address,
    primaryColor: normalized.branding.primaryColor || defaults.primaryColor,
    heroTitle: normalized.branding.heroTitle || defaults.heroTitle,
    heroSubtitle: normalized.branding.heroSubtitle || defaults.heroSubtitle,
    heroImageUrl: normalized.branding.heroImageUrl || defaults.heroImageUrl,
    themeKey: normalized.branding.themeKey || defaults.themeKey,
    professionalName: normalized.branding.professionalName || normalized.business.name,
    specialty: normalized.branding.specialty || normalized.business.segment,
    signatureTitle: normalized.branding.signatureTitle,
    signatureText: normalized.branding.signatureText,
    signatureTags: normalized.branding.signatureTags,
    instagramUrl: normalized.social.instagram,
    tiktokUrl: normalized.social.tiktok,
    linkedinUrl: normalized.social.linkedin,
    facebookUrl: normalized.social.facebook,
    youtubeUrl: normalized.social.youtube,
    websiteUrl: normalized.social.website,
    services: firstService.map((service) => ({
      name: service.name,
      description: service.description,
      duration: service.duration || '',
      price: service.price ?? '',
      image_url: service.image_url,
    })),
    schedule: {
      days: normalized.schedule.days,
      startTime: normalized.schedule.startTime,
      endTime: normalized.schedule.endTime,
      interval: normalized.schedule.intervalMinutes,
      breaks: normalized.schedule.breaks,
    },
    conversion: normalized.conversion,
    faqs: normalized.faq,
    finalCta: normalized.finalCta,
  };
}

export function mapPersonaToSupabasePayload(persona) {
  const normalized = normalizePersonaPayload(persona);
  return {
    businesses: {
      name: normalized.business.name,
      slug: normalized.business.slug,
      segment: normalized.business.segment,
      whatsapp: normalized.business.whatsapp,
      email: normalized.business.email,
      status: 'trial',
    },
    business_branding: {
      primary_color: normalized.branding.primaryColor,
      theme_key: normalized.branding.themeKey,
      hero_title: normalized.branding.heroTitle,
      hero_subtitle: normalized.branding.heroSubtitle,
      hero_image_url: normalized.branding.heroImageUrl,
    },
    business_locations: {
      name: 'Unidade principal',
      address: normalized.business.address,
      is_main: true,
    },
    services: normalized.services,
    conversion: normalized.conversion,
    faqs: normalized.faq,
    socials: normalized.social,
    finalCta: normalized.finalCta,
  };
}

export function getThemeByVertical(vertical = '') {
  const value = String(vertical).toLowerCase();
  if (/saude|m[eé]dic|odonto|dent|clin/.test(value)) return 'soft-medical';
  if (/advog|jurid|consult|financ|contador|execut/.test(value)) return 'dark-luxury';
  if (/sistema|software|tecnolog|desenvolv|ia|startup/.test(value)) return 'neo-corporate';
  if (/creator|artist|foto|video|conteudo|tatu/.test(value)) return 'creator-mode';
  if (/estetic|beleza|luxo|harmoniza/.test(value)) return 'gold-prestige';
  if (/sitio|sítio|chacara|chácara|loca|alug|reserva|hosped|temporada|evento|salao|salão|quadra|estudio|estúdio/.test(value)) return 'warm-minimal';
  return 'minimal-white';
}

function normalizeServices(services = [], segment) {
  const list = Array.isArray(services) ? services : [];
  const normalized = list
    .slice(0, 8)
    .map((service) => ({
      name: cleanText(service.title || service.name || service.subtitle || ''),
      subtitle: cleanText(service.subtitle || ''),
      description: cleanText(service.description || service.subtitle || ''),
      duration: service.durationMinutes || service.duration || null,
      price: service.price ?? '',
      image_url: cleanUrl(service.imageUrl || service.image_url || ''),
      category: cleanText(service.category || ''),
    }))
    .filter((service) => service.name);

  if (normalized.length) return normalized;

  return suggestedServices(segment).map((name, index) => ({
    name,
    subtitle: '',
    description: 'Experiência inicial sugerida pela Persona, pronta para revisão e ajuste no onboarding.',
    duration: index === 0 ? 30 : 45,
    price: '',
    image_url: '',
    category: '',
  }));
}

function normalizeFaq(items = []) {
  return (Array.isArray(items) ? items : [])
    .slice(0, 6)
    .map((item) => ({
      question: cleanText(item.question || ''),
      answer: cleanText(item.answer || ''),
    }))
    .filter((item) => item.question && item.answer);
}

function normalizeBreaks(items = []) {
  if (!Array.isArray(items) || !items.length) {
    return [{ days: [1, 2, 3, 4, 5], startTime: '12:00', endTime: '13:00', reason: 'Almoço' }];
  }

  return items.slice(0, 6).map((item) => ({
    days: normalizeScheduleDays(item.days),
    startTime: normalizeTime(item.startTime, '12:00'),
    endTime: normalizeTime(item.endTime, '13:00'),
    reason: cleanText(item.reason || 'Pausa'),
  }));
}

function normalizeScheduleDays(days) {
  if (!Array.isArray(days) || !days.length) return [1, 2, 3, 4, 5];
  const result = days
    .map((day) => {
      if (typeof day === 'number') return day;
      return weekdayMap[String(day).toLowerCase()] ?? null;
    })
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  return result.length ? [...new Set(result)].sort((a, b) => a - b) : [1, 2, 3, 4, 5];
}

function normalizeConversionMode(mode, segment) {
  if (['appointment', 'request', 'consultation', 'lead'].includes(mode)) return mode;
  const value = String(segment).toLowerCase();
  if (appointmentSegments.some((item) => value.includes(item))) return 'appointment';
  if (requestSegments.some((item) => value.includes(item))) return 'request';
  if (consultationSegments.some((item) => value.includes(item))) return 'consultation';
  return 'lead';
}

function defaultConversionCopy(mode) {
  const copies = {
    appointment: {
      title: 'Escolha uma data e horário disponível',
      subtitle: 'O calendário respeita horários, pausas, bloqueios e solicitações já cadastradas.',
      buttonLabel: 'Solicitar agendamento',
      successMessage: 'Solicitação cadastrada com sucesso. Em breve enviaremos a confirmação.',
    },
    request: {
      title: 'Conte sobre o projeto que você deseja realizar',
      subtitle: 'Descreva sua ideia, necessidade ou processo atual para receber uma análise inicial.',
      buttonLabel: 'Solicitar diagnóstico',
      successMessage: 'Solicitação enviada com sucesso. Em breve o profissional entrará em contato.',
    },
    consultation: {
      title: 'Solicite uma análise inicial',
      subtitle: 'Explique sua situação para que o profissional avalie o melhor caminho.',
      buttonLabel: 'Solicitar consultoria',
      successMessage: 'Solicitação de consultoria enviada com sucesso.',
    },
    lead: {
      title: 'Entre em contato',
      subtitle: 'Envie uma mensagem para iniciar uma conversa com o profissional.',
      buttonLabel: 'Entrar em contato',
      successMessage: 'Mensagem enviada com sucesso.',
    },
  };
  return copies[mode] || copies.appointment;
}

function defaultButtonLabel(mode) {
  return defaultConversionCopy(mode).buttonLabel;
}

function suggestedServices(segment) {
  const value = String(segment).toLowerCase();
  if (/advog|jurid/.test(value)) return ['Análise jurídica inicial', 'Consultoria preventiva', 'Estratégia processual'];
  if (/sistema|software|desenvolv/.test(value)) return ['Diagnóstico de processos', 'Sistema sob medida', 'Automação operacional'];
  if (/sitio|sítio|chacara|chácara|loca|alug|reserva|hosped|temporada|evento|salao|salão|quadra|estudio|estúdio/.test(value)) return ['Fim de semana', 'Diária para evento', 'Reserva privativa'];
  if (/odonto|dent/.test(value)) return ['Avaliação inicial', 'Clareamento', 'Limpeza preventiva'];
  if (/estetic|beleza/.test(value)) return ['Avaliação estética', 'Protocolo personalizado', 'Acompanhamento premium'];
  return ['Avaliação inicial', 'Atendimento personalizado', 'Consultoria profissional'];
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 500);
}

function cleanUrl(value) {
  return String(value || '').trim().slice(0, 1000);
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean);
  if (typeof value === 'string') return value.split('\n').map(cleanText).filter(Boolean);
  return [];
}

function normalizeColor(value) {
  const raw = String(value || '').trim();
  return /^#[0-9a-f]{6}$/i.test(raw) ? raw : '#2563eb';
}

function normalizeTime(value, fallback) {
  const raw = String(value || '').trim();
  return /^\d{2}:\d{2}$/.test(raw) ? raw : fallback;
}

function onlyPhoneDigits(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 13);
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'persona';
}

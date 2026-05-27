import { defaultEnabledModules, detectVertical, generateFallbackHeroCopy, getPresetByVertical, getRecommendedThemeKey } from './presets.js';
import { getTheme } from './theme.js';

export function buildPageConfigFromOnboarding(submission, selectedThemeKey) {
  const payload = submission.payload || {};
  const business = {
    name: submission.business_name,
    segment: submission.segment,
    whatsapp: submission.whatsapp,
    email: submission.email,
    ...(payload.businesses || {}),
  };
  const branding = {
    hero_image_url: submission.hero_image_url,
    ...(payload.business_branding || {}),
  };
  const vertical = detectVertical(business.segment || submission.segment || submission.business_name);
  const preset = getPresetByVertical(vertical);
  const themeKey = selectedThemeKey || branding.theme_key || getRecommendedThemeKey(vertical);
  const theme = getTheme(themeKey, preset.recommendedTheme);
  const fallbackHero = generateFallbackHeroCopy(vertical);
  const enabledModules = {
    ...defaultEnabledModules,
    ...(payload.enabledModules || payload.enabled_modules || {}),
  };
  const services = normalizeServices(payload.services || [], preset);

  return {
    submission,
    vertical,
    preset,
    theme,
    enabledModules,
    business,
    branding: {
      ...branding,
      hero_title: branding.hero_title || fallbackHero.title,
      hero_subtitle: branding.hero_subtitle || fallbackHero.subtitle,
    },
    location: payload.business_locations || {},
    services,
    professionals: payload.professionals || [],
    testimonials: payload.testimonials || [],
    faqs: payload.faqs || [],
    gallery: payload.gallery || payload.business_media || [],
    availability: payload.availability_rules || [],
    availabilityBreaks: payload.availability_breaks || [],
    availabilityDateBlocks: payload.availability_date_blocks || [],
    conversion: normalizeConversion(payload.conversion, preset, services),
  };
}

function normalizeServices(services, preset) {
  if (services.length) return services;

  return preset.services.slice(0, 4).map((name, index) => ({
    name,
    description: `Servico sugerido para ${preset.label.toLowerCase()}, pronto para personalizacao no painel.`,
    duration: index === 0 ? 30 : 45,
    price: '',
    image_url: '',
  }));
}

function normalizeConversion(conversion = {}, preset, services = []) {
  const mode = conversion.mode || conversion.conversionMode || 'appointment';
  const defaults = {
    appointment: {
      title: 'Escolha uma data e horário disponível',
      subtitle: 'O calendário respeita horários, pausas, bloqueios e agendamentos já cadastrados.',
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
      subtitle: 'Explique seu objetivo para que o profissional avalie o melhor caminho.',
      buttonLabel: 'Solicitar consultoria',
      successMessage: 'Solicitação de consultoria enviada com sucesso.',
      showSchedule: false,
    },
    lead: {
      title: 'Entre em contato',
      subtitle: 'Envie uma mensagem para iniciar uma conversa com o profissional.',
      buttonLabel: 'Entrar em contato',
      successMessage: 'Mensagem enviada com sucesso.',
    },
  };
  const fallback = defaults[mode] || defaults.appointment;
  const serviceOptions = services.map((service) => service.name).filter(Boolean);

  return {
    mode,
    title: conversion.title || conversion.conversionTitle || fallback.title,
    subtitle: conversion.subtitle || conversion.conversionSubtitle || fallback.subtitle,
    buttonLabel: conversion.buttonLabel || conversion.conversionButtonLabel || fallback.buttonLabel,
    successMessage: conversion.successMessage || conversion.conversionSuccessMessage || fallback.successMessage,
    showSchedule: conversion.showSchedule ?? fallback.showSchedule ?? mode === 'appointment',
    meetingFormats: conversion.meetingFormats || ['Online', 'Presencial', 'WhatsApp'],
    requestServiceTypes: normalizeOptions(conversion.requestServiceTypes, serviceOptions, preset.services),
  };
}

function normalizeOptions(primary, secondary, fallback) {
  if (Array.isArray(primary) && primary.length) return primary;
  if (typeof primary === 'string' && primary.trim()) {
    return primary.split('\n').map((item) => item.trim()).filter(Boolean);
  }
  if (Array.isArray(secondary) && secondary.length) return secondary;
  return Array.isArray(fallback) ? fallback : [];
}

/**
 * Configuração da página de demonstração (/demo/personapro).
 *
 * A demo usa exatamente o mesmo motor multi-cliente das páginas reais
 * (buildPageConfigFromOnboarding + módulos de src/landing). Ela é apenas
 * "mais um cliente", definido aqui em vez de vir do Supabase.
 *
 * Regras: sem prova social inventada (nada de nota média, nº de
 * pacientes, selo de verificação ou depoimentos fictícios). Depoimentos
 * só aparecem se existirem na tabela landing_testimonials.
 */
import { benefits, clinic, dentists, faqs, services } from '../data/landingData.js';
import heroImage from '../image/hero_image.png';

const DEMO_SLUG = 'personapro-demo';

export function getDemoSubmission() {
  return {
    id: 'demo',
    is_demo: true,
    owner_id: null,
    slug: DEMO_SLUG,
    status: 'published',
    business_name: clinic.name,
    segment: 'Odontologia',
    whatsapp: clinic.whatsapp.replace(/\D/g, ''),
    email: clinic.email,
    hero_image_url: heroImage,
    payload: {
      businesses: {
        name: clinic.name,
        segment: 'Odontologia',
        whatsapp: clinic.whatsapp.replace(/\D/g, ''),
        email: clinic.email,
        description: clinic.tagline,
      },
      business_branding: {
        theme_key: 'clean-blue',
        hero_title: 'Odontologia completa, com hora marcada.',
        hero_subtitle: 'Avaliação, tratamento e acompanhamento em um só lugar, com agendamento online.',
        hero_image_url: heroImage,
        hero_image_alt: 'Consultório odontológico da PersonaPro',
        hero_image_position: 'center 35%',
        cta_primary_text: 'Agendar',
      },
      business_locations: { name: 'Unidade principal', address: clinic.address, is_main: true },
      services: services.map((service) => ({
        name: service.title,
        description: service.description,
        duration: 0,
        price: '',
        image_url: '',
      })),
      editorialHighlight: {
        eyebrow: 'A clínica',
        title: 'Uma estrutura pensada para o seu conforto',
        description: 'Do primeiro contato ao retorno, cada etapa é organizada para que você saiba o que esperar.',
        benefits: benefits.map((item) => item.title),
      },
      professionals: dentists.map((dentist) => ({
        name: dentist.name,
        specialty: dentist.specialty,
        photo_url: dentist.image,
        bio: '',
      })),
      availability_rules: [
        ...[1, 2, 3, 4, 5].map((weekday) => ({ weekday, start_time: '08:00', end_time: '18:00', interval_minutes: 30 })),
        { weekday: 6, start_time: '08:00', end_time: '12:00', interval_minutes: 30 },
      ],
      availability_breaks: [1, 2, 3, 4, 5].map((weekday) => ({
        weekday,
        start_time: '12:00',
        end_time: '13:00',
        reason: 'Almoço',
      })),
      availability_date_blocks: [],
      conversion: { mode: 'appointment', buttonLabel: 'Solicitar agendamento' },
      // A última pergunta do arquivo de dados é sobre o código, não sobre a clínica.
      faqs: faqs.filter((item) => !/landing page|mockad/i.test(item.question + item.answer)),
      finalCta: {
        title: 'Agende sua avaliação',
        subtitle: 'Escolha o melhor dia e horário. A confirmação chega pelo WhatsApp.',
        buttonLabel: 'Agendar agora',
      },
      socials: {},
      gallery: [],
      enabledModules: {
        hero: true,
        trustStats: true,
        services: true,
        editorialHighlight: true,
        schedule: true,
        testimonials: true,
        faq: true,
        gallery: false,
        location: true,
        finalCta: true,
        footer: true,
      },
    },
  };
}

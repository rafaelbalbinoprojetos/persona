const MAX_PROMPT_LENGTH = 2200;

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método não permitido.' });
  }

  const apiKey = process.env.PERSONA;
  if (!apiKey) {
    return response.status(500).json({
      error: 'A variável PERSONA não está configurada no ambiente.',
      config: buildFallbackConfig(''),
      fallbackApplied: true,
    });
  }

  const prompt = sanitizePrompt(request.body?.prompt);
  if (!prompt) {
    return response.status(400).json({ error: 'Descreva o profissional, negócio, local ou serviço antes de gerar a página.' });
  }

  try {
    const openAiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.PERSONA_MODEL || 'gpt-4.1-mini',
        temperature: 0.45,
        input: [
          {
            role: 'system',
            content: buildSystemPrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        text: {
          format: {
            type: 'json_object',
          },
        },
      }),
    });

    const data = await openAiResponse.json();
    if (!openAiResponse.ok) {
      console.error('Persona OpenAI error:', data?.error || data);
      return response.status(200).json({
        config: buildFallbackConfig(prompt),
        fallbackApplied: true,
        warning: 'Não foi possível consultar a IA. Um fallback seguro foi aplicado.',
      });
    }

    const parsed = parsePersonaJson(data);
    if (!parsed) {
      return response.status(200).json({
        config: buildFallbackConfig(prompt),
        fallbackApplied: true,
        warning: 'A IA retornou JSON inválido. Um fallback seguro foi aplicado.',
      });
    }

    return response.status(200).json({ config: parsed, fallbackApplied: false });
  } catch (error) {
    console.error('Persona route error:', error);
    return response.status(200).json({
      config: buildFallbackConfig(prompt),
      fallbackApplied: true,
      warning: 'Erro temporário ao gerar com IA. Um fallback seguro foi aplicado.',
    });
  }
}

function buildSystemPrompt() {
  return `
Você é a IA PERSONA, consultor de posicionamento, copywriter e estruturador de páginas premium.
Gere SOMENTE JSON válido. Não escreva Markdown. Não gere código React.

Você deve interpretar o briefing com flexibilidade. O cliente pode estar criando página para:
- um profissional autônomo, consultório, clínica ou especialista;
- uma empresa ou equipe;
- um local alugável/reservável, como sítio, chácara, salão de festas, estúdio, quadra, espaço para eventos, hospedagem ou temporada;
- um serviço, experiência, produto sob reserva, projeto ou orçamento.

Não force a página a parecer de um profissional individual quando o briefing indicar um local, negócio ou serviço. Nesses casos:
- business.name deve ser o nome do local, negócio ou serviço quando houver.
- branding.professionalName pode repetir business.name ou ficar com o responsável/marca citada.
- branding.specialty deve descrever a categoria/oferta, por exemplo "Sítio para fins de semana", "Espaço para eventos", "Locação por temporada".
- Textos devem vender a experiência, estrutura, localização, comodidades, usos e reserva, não autoridade profissional.

O JSON deve seguir exatamente esta estrutura:
{
  "business": {"name":"","slug":"","segment":"","whatsapp":"","email":"","address":"","status":"trial"},
  "branding": {"professionalName":"","specialty":"","heroTitle":"","heroSubtitle":"","heroBadge":"","primaryColor":"","themeKey":"","heroImageUrl":"","ctaPrimary":"","ctaSecondary":"","tone":"","positioning":"","signatureTitle":"","signatureText":"","signatureTags":[]},
  "services": [{"title":"","subtitle":"","description":"","durationMinutes":null,"price":null,"imageUrl":"","category":""}],
  "conversion": {"mode":"appointment","calendarMode":"time_slots","title":"","subtitle":"","buttonLabel":"","successMessage":""},
  "schedule": {"enabled":true,"days":["mon","tue","wed","thu","fri"],"startTime":"08:00","endTime":"18:00","intervalMinutes":30,"breaks":[]},
  "faq": [{"question":"","answer":""}],
  "social": {"instagram":"","tiktok":"","linkedin":"","facebook":"","youtube":"","website":""},
  "finalCta": {"title":"","subtitle":"","buttonLabel":""}
}

Regras:
- Textos premium, curtos e sofisticados.
- Evite frases genéricas como "soluções inovadoras", "qualidade e excelência", "referência no mercado".
- Se depende de horário marcado, conversion.mode = "appointment".
- Se depende de reserva de data/diária/turno, como sítio, hospedagem, salão de festas, estúdio, quadra ou espaço para eventos, conversion.mode = "appointment".
- Se vende projeto/orçamento, conversion.mode = "request".
- Se vende analise estrategica, conversion.mode = "consultation".
- Se for captacao simples, conversion.mode = "lead".
- Locação, temporada, eventos, hospedagem, sítios e espaços reserváveis: use segment relacionado ao caso, como "locação de sítio", "espaço para eventos", "hospedagem por temporada"; themeKey "warm-minimal", "minimal-white" ou "dark-luxury".
- Para locais alugáveis, services deve listar ofertas/uso do espaço: "Fim de semana", "Diária para eventos", "Ensaio fotográfico", "Pacote com piscina", "Celebrações familiares", conforme o briefing.
- Para locais alugáveis, conversion.title deve convidar a escolher data ou solicitar reserva, e buttonLabel deve ser "Solicitar reserva" ou similar.
- Para hotéis, hospedagens, sítios, chácaras e locações com uma ou mais diárias, use conversion.calendarMode = "date_range" e disponibilize schedule.days para todos os dias da semana, salvo restrição explícita.
- Para consultas, horários avulsos, quadras, estúdios e eventos por turno, use conversion.calendarMode = "time_slots".
- Saude/odontologia: themeKey "soft-medical" ou "minimal-white".
- Advocacia/consultoria executiva: "dark-luxury" ou "executive-black".
- Tecnologia/desenvolvimento: "neo-corporate".
- Creator/artista: "creator-mode" ou "editorial-black".
- Estética/luxo: "gold-prestige" ou "minimal-white".
- Slug em minusculas, sem acentos, com hifens.
- Se telefone, email, imagem ou redes não forem citados, retorne string vazia.
`.trim();
}

function parsePersonaJson(data) {
  const text = data?.output_text || data?.output?.[0]?.content?.[0]?.text;
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function sanitizePrompt(value) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_PROMPT_LENGTH);
}

function buildFallbackConfig(prompt) {
  const lower = prompt.toLowerCase();
  const isLegal = /advog|jurid|direito/.test(lower);
  const isTech = /sistema|software|desenvolv|automat|aplicativo/.test(lower);
  const isDental = /dent|odonto|sorriso|implante|clareamento/.test(lower);
  const isBeauty = /estetic|beleza|cabelo|barb|harmoniza/.test(lower);
  const isRental = /sitio|sítio|chacara|chácara|fazenda|temporada|alug|loca[cç][aã]o|reserva|hosped|pousada|casa de campo|sal[aã]o|evento|festa|quadra|est[uú]dio/.test(lower);
  const usesDateRange = /sitio|sítio|chacara|chácara|fazenda|temporada|hosped|pousada|casa de campo|hotel|di[aá]ria|fim de semana/.test(lower);
  const mode = isRental || isDental || isBeauty ? 'appointment' : isLegal ? 'consultation' : isTech ? 'request' : 'lead';
  const segment = isRental ? 'locação e reservas' : isDental ? 'odontologia' : isLegal ? 'advocacia' : isTech ? 'desenvolvimento de sistemas' : isBeauty ? 'estética' : 'serviços profissionais';
  const name = isRental ? 'Espaço para Reservas' : isLegal ? 'Profissional Jurídico' : isTech ? 'Especialista em Sistemas' : isDental ? 'Profissional de Odontologia' : 'Profissional Persona';

  return {
    business: { name, slug: slugify(name), segment, whatsapp: '', email: '', address: '', status: 'trial' },
    branding: {
      professionalName: name,
      specialty: segment,
      heroTitle: isRental ? 'Um espaço preparado para viver bons momentos' : isTech ? 'Sistemas sob medida para operações mais inteligentes' : 'Uma presença profissional feita para transmitir confiança',
      heroSubtitle: isRental
        ? 'Apresente estrutura, datas disponíveis e detalhes da experiência para transformar interesse em pedidos de reserva.'
        : isTech
        ? 'Transforme processos manuais em experiências digitais claras, seguras e eficientes.'
        : 'Apresente sua autoridade com uma experiência premium, objetiva e preparada para gerar novas conversas.',
      heroBadge: segment,
      primaryColor: isLegal ? '#c9a96e' : isTech ? '#6366f1' : '#2563eb',
      themeKey: isRental ? 'warm-minimal' : isLegal ? 'dark-luxury' : isTech ? 'neo-corporate' : isDental ? 'soft-medical' : 'minimal-white',
      heroImageUrl: '',
      ctaPrimary: defaultButton(mode),
      ctaSecondary: isRental ? 'Conhecer o espaço' : 'Conhecer assinatura profissional',
      tone: 'premium, claro e autoral',
      positioning: '',
      signatureTitle: isRental ? 'Experiência do espaço' : 'Assinatura profissional',
      signatureText: isRental
        ? 'Uma experiência pensada para reunir pessoas com conforto, privacidade e detalhes que tornam a estadia mais simples.'
        : 'Um atendimento conduzido com método, presença e clareza para transformar intenção em uma experiência profissional confiável.',
      signatureTags: isRental ? ['Conforto', 'Privacidade', 'Reserva'] : ['Clareza', 'Método', 'Presença'],
    },
    services: [
      { title: isRental ? 'Fim de semana' : isTech ? 'Diagnóstico de processos' : 'Avaliação inicial', subtitle: '', description: isRental ? 'Reserva para descanso, lazer e encontros em família ou amigos.' : 'Primeira etapa para entender o contexto e orientar o melhor caminho.', durationMinutes: mode === 'appointment' ? 30 : null, price: null, imageUrl: '', category: '' },
      { title: isRental ? 'Eventos e celebrações' : isTech ? 'Projeto sob medida' : 'Atendimento personalizado', subtitle: '', description: isRental ? 'Uso do espaço para datas especiais, confraternizações e experiências privativas.' : 'Experiência desenhada de acordo com a necessidade do cliente.', durationMinutes: mode === 'appointment' ? 45 : null, price: null, imageUrl: '', category: '' },
    ],
    conversion: {
      mode,
      calendarMode: usesDateRange ? 'date_range' : 'time_slots',
      title: isRental ? 'Escolha a data da reserva' : defaultConversionTitle(mode),
      subtitle: isRental ? 'Envie a data desejada e detalhes da reserva para confirmarmos disponibilidade.' : 'Envie suas informações para que o profissional avalie o melhor próximo passo.',
      buttonLabel: isRental ? 'Solicitar reserva' : defaultButton(mode),
      successMessage: 'Solicitação enviada com sucesso. Em breve entraremos em contato.',
    },
    schedule: { enabled: mode === 'appointment', days: isRental ? ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] : ['mon', 'tue', 'wed', 'thu', 'fri'], startTime: '08:00', endTime: '18:00', intervalMinutes: 30, breaks: [] },
    faq: [
      { question: isRental ? 'Como funciona a reserva?' : 'Como funciona o primeiro contato?', answer: isRental ? 'Você envia a data desejada e as informações principais. Em seguida confirmamos disponibilidade e próximos passos.' : 'Você envia suas informações pela página e o profissional avalia o melhor próximo passo.' },
      { question: 'Posso ajustar as informações depois?', answer: 'Sim. Tudo pode ser revisado e editado no painel antes da publicação.' },
    ],
    social: { instagram: '', tiktok: '', linkedin: '', facebook: '', youtube: '', website: '' },
    finalCta: { title: isRental ? 'Pronto para reservar sua data?' : 'Pronto para começar?', subtitle: isRental ? 'Envie sua solicitação e consulte a disponibilidade do espaço.' : 'Envie sua solicitação e inicie uma conversa com mais clareza.', buttonLabel: isRental ? 'Solicitar reserva' : defaultButton(mode) },
  };
}

function defaultButton(mode) {
  return {
    appointment: 'Solicitar agendamento',
    request: 'Solicitar diagnóstico',
    consultation: 'Solicitar consultoria',
    lead: 'Entrar em contato',
  }[mode] || 'Entrar em contato';
}

function defaultConversionTitle(mode) {
  return {
    appointment: 'Escolha uma data e horário disponível',
    request: 'Conte sobre o projeto que você deseja realizar',
    consultation: 'Solicite uma análise inicial',
    lead: 'Entre em contato',
  }[mode] || 'Entre em contato';
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'persona';
}

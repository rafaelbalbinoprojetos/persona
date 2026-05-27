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
    return response.status(400).json({ error: 'Descreva o profissional antes de gerar a página.' });
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
Voce e a IA PERSONA, consultor de posicionamento, copywriter e estruturador de paginas profissionais premium.
Gere SOMENTE JSON valido. Nao escreva Markdown. Nao gere codigo React.

O JSON deve seguir exatamente esta estrutura:
{
  "business": {"name":"","slug":"","segment":"","whatsapp":"","email":"","address":"","status":"trial"},
  "branding": {"professionalName":"","specialty":"","heroTitle":"","heroSubtitle":"","heroBadge":"","primaryColor":"","themeKey":"","heroImageUrl":"","ctaPrimary":"","ctaSecondary":"","tone":"","positioning":"","signatureTitle":"","signatureText":"","signatureTags":[]},
  "services": [{"title":"","subtitle":"","description":"","durationMinutes":null,"price":null,"imageUrl":"","category":""}],
  "conversion": {"mode":"appointment","title":"","subtitle":"","buttonLabel":"","successMessage":""},
  "schedule": {"enabled":true,"days":["mon","tue","wed","thu","fri"],"startTime":"08:00","endTime":"18:00","intervalMinutes":30,"breaks":[]},
  "faq": [{"question":"","answer":""}],
  "social": {"instagram":"","tiktok":"","linkedin":"","facebook":"","youtube":"","website":""},
  "finalCta": {"title":"","subtitle":"","buttonLabel":""}
}

Regras:
- Textos premium, curtos e sofisticados.
- Evite frases genericas como "solucoes inovadoras", "qualidade e excelencia", "referencia no mercado".
- Se depende de horario marcado, conversion.mode = "appointment".
- Se vende projeto/orcamento, conversion.mode = "request".
- Se vende analise estrategica, conversion.mode = "consultation".
- Se for captacao simples, conversion.mode = "lead".
- Saude/odontologia: themeKey "soft-medical" ou "minimal-white".
- Advocacia/consultoria executiva: "dark-luxury" ou "executive-black".
- Tecnologia/desenvolvimento: "neo-corporate".
- Creator/artista: "creator-mode" ou "editorial-black".
- Estetica/luxo: "gold-prestige" ou "minimal-white".
- Slug em minusculas, sem acentos, com hifens.
- Se telefone, email, imagem ou redes nao forem citados, retorne string vazia.
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
  const mode = isDental || isBeauty ? 'appointment' : isLegal ? 'consultation' : isTech ? 'request' : 'lead';
  const segment = isDental ? 'odontologia' : isLegal ? 'advocacia' : isTech ? 'desenvolvimento de sistemas' : isBeauty ? 'estetica' : 'servicos profissionais';
  const name = isLegal ? 'Profissional Jurídico' : isTech ? 'Especialista em Sistemas' : isDental ? 'Profissional de Odontologia' : 'Profissional Persona';

  return {
    business: { name, slug: slugify(name), segment, whatsapp: '', email: '', address: '', status: 'trial' },
    branding: {
      professionalName: name,
      specialty: segment,
      heroTitle: isTech ? 'Sistemas sob medida para operações mais inteligentes' : 'Uma presença profissional feita para transmitir confiança',
      heroSubtitle: isTech
        ? 'Transforme processos manuais em experiências digitais claras, seguras e eficientes.'
        : 'Apresente sua autoridade com uma experiência premium, objetiva e preparada para gerar novas conversas.',
      heroBadge: segment,
      primaryColor: isLegal ? '#c9a96e' : isTech ? '#6366f1' : '#2563eb',
      themeKey: isLegal ? 'dark-luxury' : isTech ? 'neo-corporate' : isDental ? 'soft-medical' : 'minimal-white',
      heroImageUrl: '',
      ctaPrimary: defaultButton(mode),
      ctaSecondary: 'Conhecer assinatura profissional',
      tone: 'premium, claro e autoral',
      positioning: '',
      signatureTitle: 'Assinatura profissional',
      signatureText: 'Um atendimento conduzido com método, presença e clareza para transformar intenção em uma experiência profissional confiável.',
      signatureTags: ['Clareza', 'Método', 'Presença'],
    },
    services: [
      { title: isTech ? 'Diagnóstico de processos' : 'Avaliação inicial', subtitle: '', description: 'Primeira etapa para entender o contexto e orientar o melhor caminho.', durationMinutes: mode === 'appointment' ? 30 : null, price: null, imageUrl: '', category: '' },
      { title: isTech ? 'Projeto sob medida' : 'Atendimento personalizado', subtitle: '', description: 'Experiência desenhada de acordo com a necessidade do cliente.', durationMinutes: mode === 'appointment' ? 45 : null, price: null, imageUrl: '', category: '' },
    ],
    conversion: {
      mode,
      title: defaultConversionTitle(mode),
      subtitle: 'Envie suas informações para que o profissional avalie o melhor próximo passo.',
      buttonLabel: defaultButton(mode),
      successMessage: 'Solicitação enviada com sucesso. Em breve entraremos em contato.',
    },
    schedule: { enabled: mode === 'appointment', days: ['mon', 'tue', 'wed', 'thu', 'fri'], startTime: '08:00', endTime: '18:00', intervalMinutes: 30, breaks: [] },
    faq: [
      { question: 'Como funciona o primeiro contato?', answer: 'Você envia suas informações pela página e o profissional avalia o melhor próximo passo.' },
      { question: 'Posso ajustar as informações depois?', answer: 'Sim. Tudo pode ser revisado e editado no painel antes da publicação.' },
    ],
    social: { instagram: '', tiktok: '', linkedin: '', facebook: '', youtube: '', website: '' },
    finalCta: { title: 'Pronto para começar?', subtitle: 'Envie sua solicitação e inicie uma conversa com mais clareza.', buttonLabel: defaultButton(mode) },
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

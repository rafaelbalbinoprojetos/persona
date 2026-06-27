// Webhook do Asaas
// ----------------------------------------------------------------------------
// Recebe eventos de pagamento/assinatura do Asaas e atualiza a conta do dono
// (status, plano, validade). Use a SERVICE ROLE do Supabase (ignora RLS) — é
// o único lugar que pode "ativar" uma assinatura, então mantenha as chaves
// secretas e protegidas pelo token.
//
// Configurar no painel do Asaas (Configurações -> Integrações -> Webhooks):
//   URL:   https://SEU-DOMINIO/api/billing/webhook
//   Token: o mesmo valor de ASAAS_WEBHOOK_TOKEN
//
// Env:
//   ASAAS_WEBHOOK_TOKEN        -> token de validação (defina um valor secreto)
//   SUPABASE_URL (ou VITE_SUPABASE_URL)
//   SUPABASE_SERVICE_ROLE_KEY  -> grava a conta ignorando RLS (SECRETA!)

const ACTIVATE_EVENTS = new Set([
  'PAYMENT_CONFIRMED',
  'PAYMENT_RECEIVED',
  'PAYMENT_RECEIVED_IN_CASH',
]);
const PAST_DUE_EVENTS = new Set(['PAYMENT_OVERDUE']);
const CANCEL_EVENTS = new Set([
  'PAYMENT_DELETED',
  'PAYMENT_REFUNDED',
  'PAYMENT_CHARGEBACK_REQUESTED',
  'SUBSCRIPTION_DELETED',
]);

function supabaseEnv() {
  return {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    service: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

async function findAccount(filter) {
  const { url, service } = supabaseEnv();
  const res = await fetch(`${url}/rest/v1/accounts?${filter}&select=owner_id&limit=1`, {
    headers: { apikey: service, Authorization: `Bearer ${service}` },
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] || null;
}

async function patchAccount(ownerId, patch) {
  const { url, service } = supabaseEnv();
  await fetch(`${url}/rest/v1/accounts?owner_id=eq.${ownerId}`, {
    method: 'PATCH',
    headers: {
      apikey: service,
      Authorization: `Bearer ${service}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(patch),
  });
}

function addOneMonth(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método não permitido.' });
  }

  // Validação do token enviado pelo Asaas.
  const token = request.headers['asaas-access-token'];
  if (process.env.ASAAS_WEBHOOK_TOKEN && token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return response.status(401).json({ error: 'Token inválido.' });
  }

  const event = request.body || {};
  const type = event.event;
  const payment = event.payment || {};

  try {
    // Localiza a conta pela assinatura ou pelo cliente.
    let account = null;
    if (payment.subscription) {
      account = await findAccount(`provider_subscription_id=eq.${payment.subscription}`);
    }
    if (!account && payment.customer) {
      account = await findAccount(`provider_customer_id=eq.${payment.customer}`);
    }
    if (!account) {
      return response.status(200).json({ ok: true, ignored: 'conta não encontrada' });
    }

    if (ACTIVATE_EVENTS.has(type)) {
      await patchAccount(account.owner_id, {
        status: 'active',
        plan: 'pro',
        max_pages: 5,
        current_period_end: addOneMonth(payment.dueDate),
      });
    } else if (PAST_DUE_EVENTS.has(type)) {
      await patchAccount(account.owner_id, { status: 'past_due' });
    } else if (CANCEL_EVENTS.has(type)) {
      await patchAccount(account.owner_id, { status: 'canceled', plan: 'free', max_pages: 1 });
    }

    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error('Asaas webhook error:', error);
    // Responde 200 para evitar reenvios infinitos em caso de erro nosso.
    return response.status(200).json({ ok: true });
  }
}

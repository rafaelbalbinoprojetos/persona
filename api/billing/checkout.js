// Checkout de assinatura (Asaas)
// ----------------------------------------------------------------------------
// Cria/garante o cliente no Asaas e abre uma assinatura mensal, devolvendo o
// link de pagamento (Pix/boleto/cartão). Requer login (JWT do Supabase).
//
// Variáveis de ambiente na Vercel:
//   ASAAS_API_KEY              -> chave de API do Asaas (use a do SANDBOX para testar)
//   ASAAS_BASE_URL             -> opcional. Default: https://api-sandbox.asaas.com/v3
//                                 Produção: https://api.asaas.com/v3
//   ASAAS_PLAN_VALUE           -> opcional. Valor mensal. Default: 29
//   SUPABASE_URL (ou VITE_SUPABASE_URL)
//   SUPABASE_ANON_KEY (ou VITE_SUPABASE_ANON_KEY)  -> valida o login
//   SUPABASE_SERVICE_ROLE_KEY  -> lê/grava a conta ignorando RLS (SECRETA!)

const PLAN_VALUE = Number(process.env.ASAAS_PLAN_VALUE || 29);
const ASAAS_BASE_URL = process.env.ASAAS_BASE_URL || 'https://api-sandbox.asaas.com/v3';

function supabaseEnv() {
  return {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    anon: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
    service: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

async function getUser(request) {
  const { url, anon } = supabaseEnv();
  const authHeader = request.headers?.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!url || !anon || !token) return null;
  const res = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: anon, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const user = await res.json();
  return user?.id ? user : null;
}

async function getAccount(ownerId) {
  const { url, service } = supabaseEnv();
  const res = await fetch(
    `${url}/rest/v1/accounts?owner_id=eq.${ownerId}&select=*&limit=1`,
    { headers: { apikey: service, Authorization: `Bearer ${service}` } },
  );
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

async function asaas(path, options = {}) {
  const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      access_token: process.env.ASAAS_API_KEY,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método não permitido.' });
  }
  if (!process.env.ASAAS_API_KEY) {
    return response.status(500).json({ error: 'ASAAS_API_KEY não configurada no ambiente.' });
  }
  const { service } = supabaseEnv();
  if (!service) {
    return response.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada no ambiente.' });
  }

  const user = await getUser(request);
  if (!user) {
    return response.status(401).json({ error: 'Faça login para assinar.' });
  }

  const cpfCnpj = onlyDigits(request.body?.cpfCnpj);
  const name = String(request.body?.name || user.user_metadata?.name || user.email || 'Cliente Persona').slice(0, 100);
  if (cpfCnpj.length !== 11 && cpfCnpj.length !== 14) {
    return response.status(400).json({ error: 'Informe um CPF ou CNPJ válido.' });
  }

  const account = await getAccount(user.id);
  if (!account) {
    return response.status(400).json({ error: 'Conta não encontrada. Faça login novamente.' });
  }

  try {
    // 1. Cliente no Asaas (reutiliza se já existir).
    let customerId = account.provider_customer_id;
    if (!customerId) {
      const created = await asaas('/customers', {
        method: 'POST',
        body: JSON.stringify({ name, email: user.email, cpfCnpj }),
      });
      if (!created.ok) {
        return response.status(502).json({ error: 'Falha ao criar cliente no Asaas.', details: created.data });
      }
      customerId = created.data.id;
      await patchAccount(user.id, { provider: 'asaas', provider_customer_id: customerId });
    }

    // 2. Assinatura mensal (cliente escolhe Pix/boleto/cartão no checkout).
    const today = new Date().toISOString().slice(0, 10);
    const sub = await asaas('/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        customer: customerId,
        billingType: 'UNDEFINED',
        value: PLAN_VALUE,
        nextDueDate: today,
        cycle: 'MONTHLY',
        description: 'Assinatura Persona — plano mensal',
      }),
    });
    if (!sub.ok) {
      return response.status(502).json({ error: 'Falha ao criar assinatura no Asaas.', details: sub.data });
    }
    await patchAccount(user.id, { provider_subscription_id: sub.data.id });

    // 3. Link de pagamento da primeira cobrança.
    const payments = await asaas(`/subscriptions/${sub.data.id}/payments`);
    const first = Array.isArray(payments.data?.data) ? payments.data.data[0] : null;
    const invoiceUrl = first?.invoiceUrl || null;

    return response.status(200).json({ invoiceUrl, subscriptionId: sub.data.id });
  } catch (error) {
    console.error('Asaas checkout error:', error);
    return response.status(500).json({ error: 'Erro ao iniciar a assinatura.' });
  }
}

import { useState } from 'react';

// Modal de assinatura: coleta CPF/CNPJ, chama /api/billing/checkout e
// redireciona para o pagamento (Pix/boleto/cartão) gerado pelo Asaas.

const PLAN_PRICE_LABEL = 'R$ 29/mês';

export function SubscribeModal({ open, onClose, accessToken }) {
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  async function handleSubscribe() {
    setError('');
    const digits = cpfCnpj.replace(/\D/g, '');
    if (digits.length !== 11 && digits.length !== 14) {
      setError('Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.');
      return;
    }
    if (!accessToken) {
      setError('Sessão expirada. Faça login novamente.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ cpfCnpj: digits }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.invoiceUrl) {
        setError(data.error || 'Não foi possível iniciar a assinatura. Tente novamente.');
        setLoading(false);
        return;
      }
      // Redireciona para a página de pagamento do Asaas.
      window.location.href = data.invoiceUrl;
    } catch {
      setError('Erro de conexão. Tente novamente.');
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-7 text-slate-900 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-2xl font-extrabold">Assinar o Persona</h2>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          Plano mensal • <span className="text-slate-900">{PLAN_PRICE_LABEL}</span>. Mantenha sua
          página no ar, com agendamentos e leads ilimitados.
        </p>

        <label className="mt-6 block text-sm font-bold text-slate-700">CPF ou CNPJ</label>
        <input
          value={cpfCnpj}
          onChange={(event) => setCpfCnpj(event.target.value)}
          inputMode="numeric"
          placeholder="Somente números"
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-slate-900"
        />
        <p className="mt-2 text-xs font-medium text-slate-400">
          Necessário para emitir a cobrança (Pix, boleto ou cartão).
        </p>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-full border border-slate-300 px-4 py-3 font-bold text-slate-600 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={loading}
            className="flex-1 rounded-full bg-slate-900 px-4 py-3 font-extrabold text-white disabled:opacity-50"
          >
            {loading ? 'Gerando...' : 'Ir para o pagamento'}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { AlertCircle, ArrowRight, Bot, CheckCircle2, Loader2, RefreshCcw, Sparkles, WandSparkles } from 'lucide-react';
import { mergePersonaWithDefaults, normalizePersonaPayload, validatePersonaPayload } from './personaPayload.js';

const examples = [
  'Sou dentista em Contagem e quero divulgar clareamento, implantes e limpeza com uma página premium para transmitir confiança e permitir agendamentos.',
  'Tenho um sítio com piscina, área gourmet e campo em Betim. Quero alugar para fins de semana, festas pequenas e encontros familiares com solicitação de reserva.',
  'Tenho um salão de festas para aniversários e eventos corporativos. Quero mostrar fotos, estrutura, capacidade e receber pedidos de data.',
  'Sou advogado empresarial e quero captar consultas estratégicas com uma presença sofisticada, objetiva e segura.',
  'Sou desenvolvedor e quero apresentar meus serviços de sistemas sob medida, automações e consultoria para empresas.',
  'Sou cabeleireiro e quero receber agendamentos para cortes, coloração e tratamentos premium.',
];

export function PersonaOnboarding({ initialForm, onApply, onManual }) {
  const [prompt, setPrompt] = useState('');
  const [state, setState] = useState('idle');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);
  const [validation, setValidation] = useState(null);

  async function generate() {
    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt.length < 20) {
      setState('error');
      setMessage('Descreva um pouco mais sobre o profissional, negócio, local, serviço e objetivo da página.');
      return;
    }

    setState('loading');
    setMessage('');
    setValidation(null);

    try {
      const response = await fetch('/api/persona-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmedPrompt }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data.config) {
          const normalizedFallback = normalizePersonaPayload(data.config);
          const fallbackCheck = validatePersonaPayload(normalizedFallback);
          setResult(normalizedFallback);
          setValidation(fallbackCheck);
          setState(fallbackCheck.valid ? 'success' : 'invalid');
          setMessage(data.error || 'Aplicamos um fallback seguro para você revisar.');
          return;
        }
        throw new Error(data.error || 'Não foi possível gerar a configuração com IA.');
      }
      if (!data.config && !data.business) {
        throw new Error('A rota de IA não retornou uma configuração válida.');
      }

      const normalized = normalizePersonaPayload(data.config || data);
      const check = validatePersonaPayload(normalized);
      setResult(normalized);
      setValidation(check);
      setState(check.valid ? 'success' : 'invalid');
      setMessage(data.fallbackApplied ? 'Aplicamos um fallback seguro para você revisar.' : 'Configuração inicial gerada. Revise antes de salvar.');
    } catch (error) {
      setState('error');
      setMessage(error.message || 'Erro ao gerar a configuração. Tente novamente.');
    }
  }

  function applyResult() {
    if (!result) return;
    onApply(mergePersonaWithDefaults(result, initialForm));
  }

  return (
    <div className="min-h-screen bg-[#f8fbff]">
      <header className="border-b border-white bg-white/85 backdrop-blur-xl">
        <nav className="section-shell flex h-20 items-center justify-between">
          <a href="/" className="flex items-center gap-3 text-brand-900">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-600 text-white shadow-glow">
              <Sparkles size={23} />
            </span>
            <span className="text-xl font-extrabold">Persona</span>
          </a>
          <button onClick={onManual} className="hidden text-sm font-bold text-brand-600 sm:inline-flex">
            Criar manualmente
          </button>
        </nav>
      </header>

      <main className="section-shell py-10 sm:py-14">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white bg-white p-6 shadow-soft sm:p-8 lg:p-12">
          <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-brand-100 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-10 h-72 w-72 rounded-full bg-lilac-100 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-4 py-2 text-sm font-bold text-brand-700 shadow-sm">
                <Bot size={18} />
                Criar com IA
              </span>
              <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight tracking-[-0.03em] text-brand-900 sm:text-5xl lg:text-6xl">
                Descreva o profissional, negócio ou espaço. A Persona estrutura a página.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                A IA entende serviços, consultorias, reservas, locações e experiências agendáveis. Ela gera posicionamento, copy, tema, atendimento e FAQ para você revisar antes de salvar.
              </p>

              <div className="mt-8 grid gap-3">
                {examples.map((example) => (
                  <button
                    key={example}
                    onClick={() => setPrompt(example)}
                    className="rounded-2xl border border-slate-100 bg-[#fbfdff] p-4 text-left text-sm font-bold leading-6 text-slate-600 transition hover:-translate-y-0.5 hover:border-brand-100 hover:bg-white hover:text-brand-700 hover:shadow-sm"
                  >
                    {example}
                  </button>
                ))}
              </div>

              <button
                onClick={onManual}
                className="pill-button mt-7 border border-slate-200 bg-white text-brand-900 hover:border-brand-200 hover:text-brand-600"
              >
                Editar manualmente
                <ArrowRight size={18} />
              </button>
            </div>

            <div className="rounded-[2rem] border border-slate-100 bg-[#fbfdff] p-5 shadow-sm sm:p-6">
              <label className="block">
                <span className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase text-slate-400">
                  <WandSparkles size={17} />
                  Briefing inteligente
                </span>
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value.slice(0, 2200))}
                  placeholder="Conte sobre o profissional, negócio, local, serviço, público, cidade, diferenciais, estrutura e objetivo da página..."
                  rows={10}
                  className="w-full resize-none rounded-[1.5rem] border border-slate-100 bg-white px-5 py-4 text-sm font-semibold leading-7 text-brand-900 outline-none placeholder:text-slate-300 focus:border-brand-200 focus:ring-4 focus:ring-brand-50"
                />
              </label>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-bold text-slate-400">{prompt.length}/2200 caracteres</p>
                <button
                  onClick={generate}
                  disabled={state === 'loading'}
                  className="pill-button bg-brand-600 text-white shadow-glow hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  {state === 'loading' ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  {state === 'loading' ? 'Gerando...' : 'Gerar página com IA'}
                </button>
              </div>

              {message && (
                <div className={`mt-5 rounded-3xl p-4 text-sm font-bold leading-6 ${
                  state === 'error' || state === 'invalid' ? 'bg-red-50 text-red-600' : 'bg-mint-50 text-mint-600'
                }`}
                >
                  <div className="flex gap-3">
                    {state === 'error' || state === 'invalid' ? <AlertCircle size={19} /> : <CheckCircle2 size={19} />}
                    <p>{message}</p>
                  </div>
                  {validation?.errors?.length > 0 && (
                    <ul className="mt-3 list-disc pl-8">
                      {validation.errors.map((error) => <li key={error}>{error}</li>)}
                    </ul>
                  )}
                </div>
              )}

              {result && (
                <PersonaPreview result={result} onApply={applyResult} onRegenerate={generate} onManual={onManual} />
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function PersonaPreview({ result, onApply, onRegenerate, onManual }) {
  return (
    <div className="mt-6 rounded-[2rem] border border-white bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase text-brand-600">Preview da estrutura</p>
          <h2 className="mt-2 text-2xl font-black text-brand-900">{result.business.name}</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">/{result.business.slug}</p>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-2 text-xs font-black uppercase text-brand-700">
          {result.branding.themeKey}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <PreviewItem label="Segmento" value={result.business.segment} />
        <PreviewItem label="Atendimento" value={labelMode(result.conversion.mode)} />
      </div>

      <div className="mt-5 rounded-3xl bg-[#f8fbff] p-4">
        <p className="text-xs font-extrabold uppercase text-slate-400">Headline</p>
        <p className="mt-2 font-black text-brand-900">{result.branding.heroTitle}</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{result.branding.heroSubtitle}</p>
      </div>

      <div className="mt-5">
        <p className="mb-3 text-xs font-extrabold uppercase text-slate-400">Serviços sugeridos</p>
        <div className="grid gap-2">
          {result.services.slice(0, 4).map((service) => (
            <div key={service.name} className="rounded-2xl bg-[#f8fbff] px-4 py-3 text-sm font-bold text-slate-600">
              {service.name}
            </div>
          ))}
        </div>
      </div>

      {result.faq.length > 0 && (
        <div className="mt-5">
          <p className="mb-3 text-xs font-extrabold uppercase text-slate-400">FAQ sugerido</p>
          <p className="rounded-2xl bg-[#f8fbff] px-4 py-3 text-sm font-bold text-slate-600">
            {result.faq[0].question}
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button onClick={onApply} className="pill-button bg-brand-600 text-white shadow-glow hover:bg-brand-700">
          Aplicar e revisar
          <ArrowRight size={18} />
        </button>
        <button onClick={onRegenerate} className="pill-button border border-slate-200 bg-white text-brand-900">
          <RefreshCcw size={18} />
          Gerar novamente
        </button>
        <button onClick={onManual} className="pill-button bg-brand-50 text-brand-700">
          Editar manualmente
        </button>
      </div>
    </div>
  );
}

function PreviewItem({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#f8fbff] p-4">
      <p className="text-xs font-extrabold uppercase text-slate-400">{label}</p>
      <p className="mt-2 font-black text-brand-900">{value}</p>
    </div>
  );
}

function labelMode(mode) {
  return {
    appointment: 'Agenda com horário',
    request: 'Solicitação de projeto',
    consultation: 'Consultoria inicial',
    lead: 'Contato simples',
  }[mode] || mode;
}

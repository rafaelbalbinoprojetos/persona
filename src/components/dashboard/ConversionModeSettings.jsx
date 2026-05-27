import { Input, Textarea } from './DashboardShared.jsx';

const MODES = [
  {
    key: 'appointment',
    label: 'Agendamento com horário',
    description: 'Calendário com dias, horários, intervalos, pausas e bloqueios.',
  },
  {
    key: 'request',
    label: 'Solicitação de orçamento/projeto',
    description: 'Briefing para projetos, serviços sob orçamento e diagnósticos.',
  },
  {
    key: 'consultation',
    label: 'Consultoria inicial',
    description: 'Solicitação de análise ou reunião estratégica.',
  },
  {
    key: 'lead',
    label: 'Contato simples',
    description: 'Formulário direto para interessados entrarem em contato.',
  },
];

export function ConversionModeSettings({ conversion, onChange }) {
  const mode = conversion.mode || 'appointment';

  return (
    <div className="rounded-[2rem] border border-[var(--preview-border)] bg-[var(--preview-card)] p-5">
      <h2 className="text-xl font-extrabold">Modo de atendimento</h2>
      <p className="mt-1 text-sm font-semibold leading-6 text-[var(--preview-muted)]">
        Escolha como esta página converte visitantes em solicitações reais.
      </p>

      <div className="mt-5 grid gap-3 lg:grid-cols-4">
        {MODES.map((item) => {
          const active = mode === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange('mode', item.key)}
              className={`rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 ${
                active
                  ? 'border-[var(--preview-primary)] bg-[var(--preview-primary)] text-white shadow-[var(--preview-glow)]'
                  : 'border-[var(--preview-border)] bg-[var(--preview-surface)] text-[var(--preview-text)]'
              }`}
            >
              <span className="block text-sm font-extrabold">{item.label}</span>
              <span className={`mt-2 block text-xs font-semibold leading-5 ${active ? 'text-white/75' : 'text-[var(--preview-muted)]'}`}>
                {item.description}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Input
          label="Título da seção"
          value={conversion.title || ''}
          onChange={(value) => onChange('title', value)}
          placeholder={getFallback(mode).title}
        />
        <Input
          label="Texto do botão"
          value={conversion.buttonLabel || ''}
          onChange={(value) => onChange('buttonLabel', value)}
          placeholder={getFallback(mode).buttonLabel}
        />
        <div className="lg:col-span-2">
          <Textarea
            label="Subtítulo da seção"
            value={conversion.subtitle || ''}
            onChange={(value) => onChange('subtitle', value)}
            placeholder={getFallback(mode).subtitle}
          />
        </div>
        <div className="lg:col-span-2">
          <Input
            label="Mensagem de sucesso"
            value={conversion.successMessage || ''}
            onChange={(value) => onChange('successMessage', value)}
            placeholder={getFallback(mode).successMessage}
          />
        </div>
      </div>

      {mode === 'consultation' && (
        <label className="mt-5 flex items-start gap-3 rounded-3xl border border-[var(--preview-border)] bg-[var(--preview-surface)] p-4 text-sm font-bold text-[var(--preview-text)]">
          <input
            type="checkbox"
            checked={Boolean(conversion.showSchedule)}
            onChange={(event) => onChange('showSchedule', event.target.checked)}
            className="mt-1 h-5 w-5 accent-[var(--preview-primary)]"
          />
          <span>
            Usar calendário e horários também na consultoria
            <span className="mt-1 block text-xs font-semibold leading-5 text-[var(--preview-muted)]">
              Se desmarcado, a página recebe apenas uma solicitação de consultoria.
            </span>
          </span>
        </label>
      )}

      {mode === 'request' && (
        <div className="mt-5 rounded-3xl border border-[var(--preview-border)] bg-[var(--preview-surface)] p-4">
          <p className="text-sm font-extrabold">Tipos de serviço para o formulário</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[var(--preview-muted)]">
            Cadastre uma opção por linha. Essas opções aparecem no select “Tipo de serviço”.
          </p>
          <textarea
            value={formatOptions(conversion.requestServiceTypes)}
            onChange={(event) => onChange('requestServiceTypes', parseOptions(event.target.value))}
            rows={5}
            placeholder="Sistema web personalizado&#10;Aplicativo mobile&#10;Automação de processos&#10;Consultoria técnica"
            className="mt-4 w-full resize-none rounded-2xl border border-[var(--preview-border)] bg-[var(--preview-card)] px-4 py-3 text-sm font-bold leading-6 text-[var(--preview-text)] outline-none placeholder:text-[var(--preview-muted)] focus:border-[var(--preview-primary)]"
          />
          <p className="mt-3 text-xs font-semibold leading-5 text-[var(--preview-muted)]">
            Se ficar vazio, o sistema usa os serviços cadastrados no cliente antes de recorrer aos presets do nicho.
          </p>
        </div>
      )}

      {mode === 'lead' && (
        <div className="mt-5 rounded-3xl border border-[var(--preview-border)] bg-[var(--preview-surface)] p-4">
          <p className="text-sm font-extrabold">Campos exibidos no modo contato</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[var(--preview-muted)]">
            Nome, WhatsApp, e-mail opcional e mensagem.
          </p>
        </div>
      )}
    </div>
  );
}

function formatOptions(options = []) {
  return Array.isArray(options) ? options.join('\n') : '';
}

function parseOptions(value) {
  return String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getFallback(mode) {
  return {
    appointment: {
      title: 'Escolha uma data e horário disponível',
      subtitle: 'O calendário respeita horários, pausas, bloqueios e agendamentos já cadastrados.',
      buttonLabel: 'Solicitar agendamento',
      successMessage: 'Solicitação cadastrada com sucesso. Em breve enviaremos a confirmação.',
    },
    request: {
      title: 'Conte sobre o sistema que você deseja criar',
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
  }[mode] || {};
}

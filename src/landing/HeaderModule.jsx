import { Settings, Sparkles } from 'lucide-react';
import { buttonClass } from './theme.js';

export function HeaderModule({ config, theme, onOpenSettings }) {
  const { business, preset, conversion } = config;
  const Icon = preset.Icon || Sparkles;
  const conversionLabel = getConversionLabel(conversion?.mode);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--preview-border)] bg-[var(--preview-surface)]/90 backdrop-blur-xl">
      <nav className="section-shell flex h-20 items-center justify-between">
        <a href="#top" className="flex items-center gap-3">
          <span
            className="grid h-11 w-11 place-items-center text-white shadow-[var(--preview-glow)]"
            style={{ backgroundColor: theme.primary, borderRadius: theme.radius }}
          >
            <Icon size={23} />
          </span>
          <span className="text-xl font-extrabold">{business.name}</span>
        </a>

        <div className="hidden items-center gap-8 lg:flex">
          <a href="#servicos" className="text-sm font-semibold text-[var(--preview-muted)] hover:text-[var(--preview-primary)]">
            {preset.sectionLabels.services}
          </a>
          <a href="#galeria" className="text-sm font-semibold text-[var(--preview-muted)] hover:text-[var(--preview-primary)]">
            Galeria
          </a>
          <a href="#agenda" className="text-sm font-semibold text-[var(--preview-muted)] hover:text-[var(--preview-primary)]">
            {conversionLabel}
          </a>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenSettings}
            className="grid h-11 w-11 place-items-center rounded-full border border-[var(--preview-border)] bg-[var(--preview-card)] text-[var(--preview-text)] transition hover:-translate-y-0.5"
            aria-label="Abrir configurações de tema"
          >
            <Settings size={20} />
          </button>
          <a
            href="#agenda"
            className={buttonClass(theme, 'hidden sm:inline-flex')}
            style={theme.buttonStyle === 'outline' ? undefined : { backgroundColor: theme.primary }}
          >
            {conversion?.buttonLabel || conversionLabel}
          </a>
        </div>
      </nav>
    </header>
  );
}

function getConversionLabel(mode) {
  return {
    appointment: 'Agenda online',
    request: 'Solicitação',
    consultation: 'Consultoria',
    lead: 'Contato',
  }[mode] || 'Atendimento';
}

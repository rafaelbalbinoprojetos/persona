import { CalendarCheck, ClipboardCheck, LogOut, Settings, Sparkles } from 'lucide-react';
import { buttonClass } from './theme.js';

export function HeaderModule({ config, theme, onOpenSettings, onSignOut, canEdit = false }) {
  const { business, preset, conversion } = config;
  const Icon = preset.Icon || Sparkles;
  const conversionLabel = conversion?.mode === 'appointment' ? preset.sectionLabels.schedule : getConversionLabel(conversion?.mode);
  const ctaLabel = conversion?.buttonLabel || conversionLabel;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--preview-border)] bg-[var(--preview-surface)]/90 backdrop-blur-xl">
      <nav className="section-shell flex h-20 items-center justify-between gap-3">
        <a href="#top" className="flex min-w-0 items-center gap-3">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center text-white shadow-[var(--preview-glow)]"
            style={{ backgroundColor: theme.primary, borderRadius: theme.radius }}
          >
            <Icon size={23} />
          </span>
          <span className="truncate text-lg font-extrabold sm:text-xl">{business.name}</span>
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
          <a
            href="#agenda"
            className={buttonClass(theme, 'h-11 shrink-0 px-3 py-0 sm:px-5')}
            style={theme.buttonStyle === 'outline' ? undefined : { backgroundColor: theme.primary }}
            aria-label={ctaLabel}
          >
            <ClipboardCheck size={18} />
            <span className="hidden sm:inline">{ctaLabel}</span>
          </a>
          {canEdit && (
            <>
              <a
                href={`/agenda?slug=${encodeURIComponent(config.submission?.slug || '')}`}
                className="flex h-11 shrink-0 items-center gap-2 rounded-full border border-[var(--preview-border)] bg-[var(--preview-card)] px-3 text-sm font-bold text-[var(--preview-text)] transition hover:-translate-y-0.5 sm:px-4"
                aria-label="Agenda e reservas"
              >
                <CalendarCheck size={18} />
                <span className="hidden sm:inline">Agenda</span>
              </a>
              <button
                type="button"
                onClick={onOpenSettings}
                className="grid h-11 w-11 place-items-center rounded-full border border-[var(--preview-border)] bg-[var(--preview-card)] text-[var(--preview-text)] transition hover:-translate-y-0.5"
                aria-label="Abrir configurações de tema"
              >
                <Settings size={20} />
              </button>
              <button
                type="button"
                onClick={onSignOut}
                className="grid h-11 w-11 place-items-center rounded-full border border-[var(--preview-border)] bg-[var(--preview-card)] text-[var(--preview-muted)] transition hover:-translate-y-0.5 hover:text-[var(--preview-text)]"
                aria-label="Sair da conta"
              >
                <LogOut size={18} />
              </button>
            </>
          )}
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

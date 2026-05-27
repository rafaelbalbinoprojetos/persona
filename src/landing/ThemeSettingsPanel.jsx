import { ArrowRight, Palette, X } from 'lucide-react';
import { themeTokens } from './theme.js';

export function ThemeSettingsPanel({ open, currentTheme, slug, onClose, onSelect }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      {/* ── Fundo desfocado ── */}
      <button
        type="button"
        aria-label="Fechar configurações"
        className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* ── Painel lateral ── */}
      <aside className="absolute right-4 top-24 w-[calc(100%-2rem)] max-w-md rounded-[2rem] border border-[var(--preview-border)] bg-[var(--preview-surface)] p-5 shadow-[var(--preview-shadow)] sm:right-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-extrabold uppercase text-[var(--preview-primary)]">
              <Palette size={18} />
              Aparência
            </div>
            <h2 className="mt-2 text-2xl font-extrabold">Temas da página</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[var(--preview-muted)]">
              Escolha uma combinação visual para esta página do cliente.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--preview-card)]"
            aria-label="Fechar painel"
          >
            <X size={19} />
          </button>
        </div>

        <div className="mt-6 grid gap-3">
          {themeTokens.map((token) => {
            const selected = token.key === currentTheme;
            return (
              <button
                key={token.key}
                type="button"
                onClick={() => onSelect(token.key)}
                className={`flex items-center justify-between gap-4 rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 ${
                  selected ? 'border-[var(--preview-primary)]' : 'border-[var(--preview-border)]'
                }`}
                style={{ backgroundColor: token.surfaceAlt, color: token.text }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[token.primary, token.accent, token.background].map((color) => (
                      <span
                        key={color}
                        className="h-8 w-8 rounded-full border border-white/70"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div>
                    <p className="font-extrabold">{token.name}</p>
                    <p className="mt-1 text-xs font-bold opacity-70">{token.mode}</p>
                  </div>
                </div>
                {selected && (
                  <span
                    className="rounded-full px-3 py-1 text-xs font-extrabold text-white"
                    style={{ backgroundColor: token.primary }}
                  >
                    Ativo
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <a
          href={`/dashboard?slug=${encodeURIComponent(slug)}`}
          className="pill-button mt-6 w-full bg-[var(--preview-primary)] text-white shadow-[var(--preview-glow)]"
        >
          Editar cadastro
          <ArrowRight size={18} />
        </a>
      </aside>
    </div>
  );
}

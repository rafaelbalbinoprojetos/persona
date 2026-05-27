/** Componentes de UI reutilizáveis do Dashboard */

export function Input({ label, value, onChange, type = 'text', icon, placeholder = '' }) {
  return (
    <label className="block rounded-3xl border border-[var(--preview-border)] bg-[var(--preview-card)] p-4">
      <span className="mb-3 flex items-center gap-2 text-xs font-bold uppercase text-[var(--preview-muted)]">
        {icon}
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[var(--preview-border)] bg-[var(--preview-surface)] px-4 py-3 text-sm font-bold text-[var(--preview-text)] outline-none transition placeholder:text-[var(--preview-muted)]/60 focus:border-[var(--preview-primary)] focus:ring-4 focus:ring-[var(--preview-primary)]/15"
      />
    </label>
  );
}

export function Textarea({ label, value, onChange, rows = 4 }) {
  return (
    <label className="block rounded-3xl border border-[var(--preview-border)] bg-[var(--preview-card)] p-4">
      <span className="mb-3 block text-xs font-bold uppercase text-[var(--preview-muted)]">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="w-full resize-none rounded-2xl border border-[var(--preview-border)] bg-[var(--preview-surface)] px-4 py-3 text-sm font-bold leading-6 text-[var(--preview-text)] outline-none focus:border-[var(--preview-primary)] focus:ring-4 focus:ring-[var(--preview-primary)]/15"
      />
    </label>
  );
}

export function EmptyState({ text }) {
  return (
    <div className="rounded-3xl bg-[var(--preview-card)] p-8 text-center font-bold text-[var(--preview-muted)]">
      {text}
    </div>
  );
}

/** Métrica usada na aba Resumo */
export function Metric({ label, value }) {
  return (
    <div className="rounded-[2rem] border border-[var(--preview-border)] bg-[var(--preview-card)] p-6">
      <p className="text-3xl font-extrabold text-[var(--preview-text)]">{value}</p>
      <p className="mt-2 text-sm font-bold text-[var(--preview-muted)]">{label}</p>
    </div>
  );
}

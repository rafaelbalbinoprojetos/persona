import { Save, Star } from 'lucide-react';
import { Input } from './DashboardShared.jsx';

const TESTIMONIAL_MAX_LENGTH = 420;

const TESTIMONIAL_STATUSES = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'pending', label: 'Pendente' },
  { value: 'active', label: 'Ativo' },
  { value: 'inactive', label: 'Inativo' },
];

const TESTIMONIAL_SUGGESTIONS = [
  'O atendimento foi muito acolhedor e me senti seguro durante todo o processo.',
  'Consegui agendar com facilidade e fui muito bem atendido.',
  'A experiência foi organizada, clara e profissional desde o primeiro contato.',
];

export function TestimonialsEditor({
  draft,
  testimonials,
  status,
  filter,
  form,
  editingId,
  dashboardConfig,
  onFilterChange,
  onFormChange,
  onSave,
  onReset,
  onEdit,
  onUpdate,
  onDelete,
}) {
  const services = draft.payload.services || [];
  const filteredTestimonials = testimonials.filter(
    (item) => filter === 'all' || item.status === filter,
  );
  const remaining = TESTIMONIAL_MAX_LENGTH - form.testimonial_text.length;
  const previewItem = {
    ...form,
    testimonial_text:
      form.testimonial_text || 'O preview do depoimento aparece aqui enquanto você edita.',
  };

  function updateField(field, value) {
    onFormChange((current) => ({
      ...current,
      [field]: field === 'rating' ? Number(value) : value,
    }));
  }

  function improveText() {
    onFormChange((current) => ({
      ...current,
      testimonial_text: improveTestimonialText(current.testimonial_text, dashboardConfig?.vertical),
    }));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(440px,1.08fr)]">
      {/* ── Coluna esquerda: formulário + sugestões ── */}
      <div className="grid gap-6">
        <div className="rounded-[2rem] bg-[#fbfdff] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold">
                {editingId ? 'Editar depoimento' : 'Novo depoimento'}
              </h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                Publique apenas depoimentos reais e autorizados pelo cliente.
              </p>
            </div>
            <button
              onClick={onReset}
              className="pill-button bg-white px-4 py-2 text-brand-700 hover:bg-brand-50"
            >
              Novo
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Input
              label="Nome do cliente/paciente"
              value={form.customer_name}
              onChange={(value) => updateField('customer_name', value)}
            />
            <Input
              label="Iniciais públicas"
              value={form.public_initials}
              onChange={(value) => updateField('public_initials', value.slice(0, 4).toUpperCase())}
            />
            <Input
              label="URL da foto opcional"
              value={form.photo_url}
              onChange={(value) => updateField('photo_url', value)}
            />

            <SelectField
              label="Serviço relacionado"
              value={form.related_service}
              onChange={(value) => updateField('related_service', value)}
            >
              <option value="">Sem serviço específico</option>
              {services.map((service) => (
                <option key={service.name} value={service.name}>{service.name}</option>
              ))}
            </SelectField>

            <SelectField
              label="Nota"
              value={String(form.rating)}
              onChange={(value) => updateField('rating', value)}
            >
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={rating}>
                  {rating} estrela{rating > 1 ? 's' : ''}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Status de publicação"
              value={form.status}
              onChange={(value) => updateField('status', value)}
            >
              {TESTIMONIAL_STATUSES.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </SelectField>

            <label className="block rounded-3xl border border-slate-100 bg-[#fbfdff] p-4 sm:col-span-2">
              <span className="mb-3 flex items-center justify-between gap-3 text-xs font-bold uppercase text-slate-400">
                Texto do depoimento
                <span className={remaining < 0 ? 'text-red-500' : 'text-slate-400'}>
                  {form.testimonial_text.length}/{TESTIMONIAL_MAX_LENGTH}
                </span>
              </span>
              <textarea
                value={form.testimonial_text}
                onChange={(event) =>
                  updateField('testimonial_text', event.target.value.slice(0, TESTIMONIAL_MAX_LENGTH + 40))
                }
                rows={5}
                className="w-full resize-none rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold leading-6 outline-none focus:border-brand-200 focus:ring-4 focus:ring-brand-50"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex items-start gap-3 rounded-3xl bg-white p-4 text-sm font-bold text-slate-600">
              <input
                type="checkbox"
                checked={form.authorized}
                onChange={(event) => updateField('authorized', event.target.checked)}
                className="mt-1 h-5 w-5 accent-brand-600"
              />
              Confirmo que tenho autorização para exibir este depoimento publicamente.
            </label>
            <label className="flex items-start gap-3 rounded-3xl bg-white p-4 text-sm font-bold text-slate-600">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) => updateField('featured', event.target.checked)}
                className="mt-1 h-5 w-5 accent-brand-600"
              />
              Marcar como destaque na landing.
            </label>
          </div>

          {status.message && (
            <p className={`mt-4 rounded-2xl p-4 text-sm font-bold ${
              status.type === 'error'
                ? 'bg-red-50 text-red-600'
                : status.type === 'success'
                  ? 'bg-mint-50 text-mint-500'
                  : 'bg-brand-50 text-brand-700'
            }`}>
              {status.message}
            </p>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onSave}
              disabled={status.type === 'saving'}
              className="pill-button bg-brand-600 text-white shadow-glow disabled:bg-slate-300"
            >
              <Save size={18} />
              {status.type === 'saving' ? 'Salvando...' : 'Salvar depoimento'}
            </button>
            <button
              onClick={improveText}
              className="pill-button bg-brand-50 px-4 py-2 text-brand-700 hover:bg-brand-600 hover:text-white"
            >
              Melhorar texto
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] bg-[#fbfdff] p-5">
          <h2 className="text-xl font-extrabold">Modelos sugeridos</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            Sugestões editáveis para usar como base, nunca como depoimento falso.
          </p>
          <div className="mt-5 grid gap-3">
            {TESTIMONIAL_SUGGESTIONS.map((suggestion) => (
              <div key={suggestion} className="rounded-3xl bg-white p-4">
                <p className="text-sm font-semibold leading-6 text-slate-600">"{suggestion}"</p>
                <button
                  onClick={() => onFormChange((current) => ({ ...current, testimonial_text: suggestion }))}
                  className="pill-button mt-3 bg-brand-50 px-4 py-2 text-brand-700 hover:bg-brand-600 hover:text-white"
                >
                  Usar como base
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Coluna direita: preview + lista ── */}
      <div className="grid gap-6">
        <div className="rounded-[2rem] bg-[#fbfdff] p-5">
          <h2 className="text-xl font-extrabold">Preview do card</h2>
          <TestimonialPreview item={previewItem} dashboardConfig={dashboardConfig} />
        </div>

        <div className="rounded-[2rem] bg-[#fbfdff] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-extrabold">Depoimentos cadastrados</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {testimonials.length} registro(s)
              </p>
            </div>
            <select
              value={filter}
              onChange={(event) => onFilterChange(event.target.value)}
              className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-brand-200 focus:ring-4 focus:ring-brand-50"
            >
              <option value="all">Todos os status</option>
              {TESTIMONIAL_STATUSES.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="mt-5 space-y-4">
            {status.type === 'loading' ? (
              <div className="rounded-3xl bg-[#fbfdff] p-8 text-center font-bold text-slate-500">
                Carregando depoimentos...
              </div>
            ) : filteredTestimonials.length ? (
              filteredTestimonials.map((item) => (
                <article key={item.id} className="rounded-3xl bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-extrabold">
                          {getTestimonialPublicName(item, dashboardConfig?.preset)}
                        </h3>
                        <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${testimonialStatusClass(item.status)}`}>
                          {testimonialStatusLabel(item.status)}
                        </span>
                        {item.featured && (
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-600">
                            Destaque
                          </span>
                        )}
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-600">
                        {item.testimonial_text}
                      </p>
                      <p className="mt-2 text-xs font-bold text-slate-400">
                        {item.related_service || 'Sem serviço específico'} — {item.rating}/5
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        onClick={() => onEdit(item)}
                        className="rounded-full bg-brand-50 px-4 py-2 text-xs font-extrabold text-brand-700"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onUpdate(item.id, { status: item.status === 'active' ? 'inactive' : 'active' })}
                        className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-extrabold text-emerald-600"
                      >
                        {item.status === 'active' ? 'Inativar' : 'Ativar'}
                      </button>
                      <button
                        onClick={() => onUpdate(item.id, { featured: !item.featured })}
                        className="rounded-full bg-amber-50 px-4 py-2 text-xs font-extrabold text-amber-600"
                      >
                        {item.featured ? 'Remover destaque' : 'Destacar'}
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="rounded-full bg-red-50 px-4 py-2 text-xs font-extrabold text-red-500"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-3xl bg-[#fbfdff] p-8 text-center font-bold text-slate-500">
                Nenhum depoimento encontrado para este filtro.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function SelectField({ label, value, onChange, children }) {
  return (
    <label className="block rounded-3xl border border-slate-100 bg-[#fbfdff] p-4">
      <span className="mb-3 block text-xs font-bold uppercase text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-brand-200 focus:ring-4 focus:ring-brand-50"
      >
        {children}
      </select>
    </label>
  );
}

function TestimonialPreview({ item, dashboardConfig }) {
  const preset = dashboardConfig?.preset;
  return (
    <div className="mt-5 rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-600 text-lg font-extrabold text-white">
          {getTestimonialInitials(item)}
        </span>
        <div>
          <p className="font-extrabold">{getTestimonialPublicName(item, preset)}</p>
          <p className="text-sm font-bold text-slate-500">
            {item.related_service || preset?.label || 'Serviço relacionado'}
          </p>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-1 text-amber-400">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            size={17}
            fill={index < Number(item.rating || 5) ? 'currentColor' : 'none'}
          />
        ))}
        <span className="ml-2 text-sm font-extrabold text-brand-900">
          {Number(item.rating || 5).toFixed(1)}
        </span>
      </div>
      <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">"{item.testimonial_text}"</p>
      {!item.authorized && (
        <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs font-extrabold text-amber-600">
          Ainda sem autorização pública.
        </p>
      )}
    </div>
  );
}

// ─── Funções utilitárias ─────────────────────────────────────────────────────

function testimonialStatusLabel(status) {
  return TESTIMONIAL_STATUSES.find((item) => item.value === status)?.label || status || 'Rascunho';
}

function testimonialStatusClass(status) {
  const classes = {
    draft: 'bg-slate-100 text-slate-600',
    pending: 'bg-amber-50 text-amber-600',
    active: 'bg-emerald-50 text-emerald-600',
    inactive: 'bg-red-50 text-red-500',
  };
  return classes[status] || classes.draft;
}

function getTestimonialPublicName(item, preset) {
  return (
    item.customer_name?.trim()
    || item.public_initials?.trim()
    || (preset?.label === 'Odontologia' ? 'Paciente verificado' : 'Cliente verificado')
  );
}

function getTestimonialInitials(item) {
  const source = item.public_initials || item.customer_name || 'CV';
  return (
    String(source)
      .trim()
      .split(/\s+/)
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'CV'
  );
}

function improveTestimonialText(text, vertical) {
  const cleanText = String(text || '').trim().replace(/\s+/g, ' ');
  if (!cleanText) return '';

  const withPeriod = /[.!?]$/.test(cleanText) ? cleanText : `${cleanText}.`;
  const prefixByVertical = {
    dental: 'O atendimento foi acolhedor e profissional.',
    legal: 'A orientação foi clara, segura e muito profissional.',
    aesthetic: 'A experiência foi cuidadosa, organizada e acolhedora.',
    medical: 'O atendimento transmitiu segurança, clareza e cuidado.',
    consulting: 'A experiência foi objetiva, organizada e profissional.',
  };

  const prefix = prefixByVertical[vertical];
  if (!prefix || withPeriod.toLowerCase().includes(prefix.toLowerCase().slice(0, 18))) {
    return withPeriod;
  }
  return `${withPeriod} ${prefix}`.slice(0, TESTIMONIAL_MAX_LENGTH);
}

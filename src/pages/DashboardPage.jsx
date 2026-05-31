import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CalendarCheck,
  Edit3,
  Image,
  LayoutDashboard,
  LogOut,
  Palette,
  Plus,
  Save,
  Settings,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js';
import { buildPageConfigFromOnboarding } from '../landing/pageConfig.js';
import { defaultEnabledModules } from '../landing/presets.js';
import { themeToCssVars } from '../landing/theme.js';

import { AgendaEditor } from '../components/dashboard/AgendaEditor.jsx';
import { AppearanceEditor } from '../components/dashboard/AppearanceEditor.jsx';
import { GalleryEditor } from '../components/dashboard/GalleryEditor.jsx';
import { Overview } from '../components/dashboard/Overview.jsx';
import { ServicesEditor } from '../components/dashboard/ServicesEditor.jsx';
import { TestimonialsEditor } from '../components/dashboard/TestimonialsEditor.jsx';

// ─── Configuração das abas ────────────────────────────────────────────────────

const TABS = [
  { key: 'overview', label: 'Resumo', Icon: LayoutDashboard },
  { key: 'appearance', label: 'Aparência', Icon: Palette },
  { key: 'services', label: 'Serviços', Icon: Sparkles },
  { key: 'gallery', label: 'Galeria', Icon: Image },
  { key: 'testimonials', label: 'Depoimentos', Icon: Star },
  { key: 'agenda', label: 'Atendimento', Icon: CalendarCheck },
];

const EMPTY_TESTIMONIAL_FORM = {
  customer_name: '',
  public_initials: '',
  photo_url: '',
  related_service: '',
  rating: 5,
  testimonial_text: '',
  authorized: false,
  status: 'draft',
  featured: false,
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function DashboardPage() {
  const initialSlug = new URLSearchParams(window.location.search).get('slug') || '';
  const initialTab = new URLSearchParams(window.location.search).get('tab') || '';

  const [submissions, setSubmissions] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [activeTab, setActiveTab] = useState(initialTab || (initialSlug ? 'appearance' : 'overview'));
  const [draft, setDraft] = useState(null);
  const [status, setStatus] = useState({ type: 'idle', message: '' });

  // Depoimentos
  const [testimonials, setTestimonials] = useState([]);
  const [testimonialsStatus, setTestimonialsStatus] = useState({ type: 'idle', message: '' });
  const [testimonialFilter, setTestimonialFilter] = useState('all');
  const [testimonialForm, setTestimonialForm] = useState(EMPTY_TESTIMONIAL_FORM);
  const [editingTestimonialId, setEditingTestimonialId] = useState('');

  const selectedSubmission = useMemo(
    () => submissions.find((item) => item.id === selectedId),
    [selectedId, submissions],
  );

  const dashboardConfig = useMemo(
    () => (draft ? buildPageConfigFromOnboarding(draft, draft.payload.business_branding?.theme_key) : null),
    [draft],
  );

  const dashboardStyle = useMemo(
    () => (dashboardConfig ? themeToCssVars(dashboardConfig.theme) : undefined),
    [dashboardConfig],
  );

  useEffect(() => { loadSubmissions(); }, []);

  useEffect(() => {
    if (!selectedSubmission) return;
    setDraft(normalizeDraft(selectedSubmission));
  }, [selectedSubmission]);

  useEffect(() => {
    if (!selectedSubmission?.slug) return;
    loadTestimonials(selectedSubmission.slug);
  }, [selectedSubmission?.slug]);

  // ─── Carregamento de dados ──────────────────────────────────────────────────

  async function loadSubmissions() {
    if (!isSupabaseConfigured) {
      setStatus({ type: 'error', message: 'Supabase não configurado.' });
      return;
    }
    const { data, error } = await supabase
      .from('onboarding_submissions')
      .select('id, business_name, slug, segment, whatsapp, email, hero_image_url, payload, status, created_at')
      .order('created_at', { ascending: false });

    if (error) { setStatus({ type: 'error', message: error.message }); return; }

    setSubmissions(data || []);
    setSelectedId((current) => {
      if (current && data?.some((item) => item.id === current)) return current;
      const matchBySlug = data?.find((item) => item.slug === initialSlug);
      return matchBySlug?.id || data?.[0]?.id || '';
    });
  }

  async function loadTestimonials(slug) {
    if (!isSupabaseConfigured) return;
    setTestimonialsStatus({ type: 'loading', message: 'Carregando depoimentos...' });
    const { data, error } = await supabase
      .from('landing_testimonials')
      .select('id, submission_slug, customer_name, public_initials, photo_url, testimonial_text, rating, related_service, authorized, status, featured, created_at, updated_at')
      .eq('submission_slug', slug)
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      setTestimonials([]);
      setTestimonialsStatus({
        type: 'error',
        message: error.code === '42P01' || error.code === 'PGRST205'
          ? 'Tabela de depoimentos não encontrada. Execute supabase/landing_testimonials.sql no SQL Editor.'
          : error.message,
      });
      return;
    }
    setTestimonials(data || []);
    setTestimonialsStatus({ type: 'success', message: '' });
  }

  // ─── Ações de depoimentos ───────────────────────────────────────────────────

  function resetTestimonialForm(clearStatus = true) {
    setEditingTestimonialId('');
    setTestimonialForm(EMPTY_TESTIMONIAL_FORM);
    if (clearStatus) setTestimonialsStatus({ type: 'idle', message: '' });
  }

  function editTestimonial(testimonial) {
    setEditingTestimonialId(testimonial.id);
    setTestimonialForm({
      customer_name: testimonial.customer_name || '',
      public_initials: testimonial.public_initials || '',
      photo_url: testimonial.photo_url || '',
      related_service: testimonial.related_service || '',
      rating: Number(testimonial.rating || 5),
      testimonial_text: testimonial.testimonial_text || '',
      authorized: Boolean(testimonial.authorized),
      status: testimonial.status || 'draft',
      featured: Boolean(testimonial.featured),
    });
    setTestimonialsStatus({ type: 'idle', message: '' });
  }

  async function saveTestimonial() {
    if (!draft?.slug) return;
    const text = testimonialForm.testimonial_text.trim();
    if (text.length < 12) {
      setTestimonialsStatus({ type: 'error', message: 'Informe um depoimento com pelo menos 12 caracteres.' });
      return;
    }
    if (text.length > 420) {
      setTestimonialsStatus({ type: 'error', message: 'Limite o depoimento a 420 caracteres.' });
      return;
    }
    if (testimonialForm.status === 'active' && !testimonialForm.authorized) {
      setTestimonialsStatus({ type: 'error', message: 'Para publicar como ativo, confirme a autorização de uso público.' });
      return;
    }

    setTestimonialsStatus({ type: 'saving', message: 'Salvando depoimento...' });
    const payload = {
      submission_slug: draft.slug,
      customer_name: testimonialForm.customer_name.trim() || null,
      public_initials: testimonialForm.public_initials.trim() || null,
      photo_url: testimonialForm.photo_url.trim() || null,
      related_service: testimonialForm.related_service.trim() || null,
      rating: Number(testimonialForm.rating || 5),
      testimonial_text: text,
      authorized: Boolean(testimonialForm.authorized),
      status: testimonialForm.status,
      featured: Boolean(testimonialForm.featured),
      source: 'dashboard',
    };

    const request = editingTestimonialId
      ? supabase.from('landing_testimonials').update(payload).eq('id', editingTestimonialId)
      : supabase.from('landing_testimonials').insert(payload);

    const { error } = await request;
    if (error) { setTestimonialsStatus({ type: 'error', message: error.message }); return; }

    setTestimonialsStatus({ type: 'success', message: 'Depoimento salvo.' });
    resetTestimonialForm(false);
    await loadTestimonials(draft.slug);
  }

  async function updateTestimonial(id, fields) {
    if (fields.status === 'active') {
      const current = testimonials.find((item) => item.id === id);
      if (!current?.authorized) {
        setTestimonialsStatus({ type: 'error', message: 'Não é possível ativar sem autorização de uso público.' });
        return;
      }
    }
    setTestimonialsStatus({ type: 'saving', message: 'Atualizando depoimento...' });
    const { error } = await supabase.from('landing_testimonials').update(fields).eq('id', id);
    if (error) { setTestimonialsStatus({ type: 'error', message: error.message }); return; }
    setTestimonials((current) => current.map((item) => (item.id === id ? { ...item, ...fields } : item)));
    setTestimonialsStatus({ type: 'success', message: 'Depoimento atualizado.' });
  }

  async function deleteTestimonial(id) {
    if (!window.confirm('Excluir este depoimento? Esta ação não pode ser desfeita.')) return;
    setTestimonialsStatus({ type: 'saving', message: 'Excluindo depoimento...' });
    const { error } = await supabase.from('landing_testimonials').delete().eq('id', id);
    if (error) { setTestimonialsStatus({ type: 'error', message: error.message }); return; }
    setTestimonials((current) => current.filter((item) => item.id !== id));
    if (editingTestimonialId === id) resetTestimonialForm();
    setTestimonialsStatus({ type: 'success', message: 'Depoimento excluído.' });
  }

  // ─── Mutações do draft ──────────────────────────────────────────────────────

  function updateBusiness(field, value) {
    setDraft((current) => ({
      ...current,
      payload: { ...current.payload, businesses: { ...current.payload.businesses, [field]: value } },
    }));
  }

  function updateBranding(field, value) {
    if (field === 'theme_key' && draft?.slug) {
      if (value) localStorage.setItem(`preview-theme:${draft.slug}`, value);
      else localStorage.removeItem(`preview-theme:${draft.slug}`);
    }

    setDraft((current) => ({
      ...current,
      hero_image_url: field === 'hero_image_url' ? value : current.hero_image_url,
      payload: { ...current.payload, business_branding: { ...current.payload.business_branding, [field]: value } },
    }));
  }

  function updatePrimaryProfessional(field, value) {
    setDraft((current) => {
      const professionals = current.payload.professionals || [];
      const first = professionals[0] || {
        name: current.payload.businesses?.name || current.business_name || '',
        specialty: current.payload.businesses?.segment || current.segment || '',
        bio: '',
        photo_url: '',
      };
      return {
        ...current,
        payload: {
          ...current.payload,
          professionals: [{ ...first, [field]: value }, ...professionals.slice(1)],
        },
      };
    });
  }

  function updateEnabledModule(moduleKey, enabled) {
    setDraft((current) => ({
      ...current,
      payload: {
        ...current.payload,
        enabledModules: {
          ...defaultEnabledModules,
          ...(current.payload.enabledModules || current.payload.enabled_modules || {}),
          [moduleKey]: enabled,
        },
      },
    }));
  }

  function updateConversion(field, value) {
    setDraft((current) => ({
      ...current,
      payload: {
        ...current.payload,
        conversion: {
          mode: 'appointment',
          ...(current.payload.conversion || {}),
          [field]: value,
        },
      },
    }));
  }

  function updateService(index, field, value) {
    setDraft((current) => ({
      ...current,
      payload: {
        ...current.payload,
        services: current.payload.services.map((service, i) =>
          i === index ? { ...service, [field]: value } : service,
        ),
      },
    }));
  }

  function addService() {
    setDraft((current) => ({
      ...current,
      payload: {
        ...current.payload,
        services: [...current.payload.services, { name: '', description: '', duration: 30, price: '', image_url: '' }],
      },
    }));
  }

  function removeService(index) {
    setDraft((current) => ({
      ...current,
      payload: { ...current.payload, services: current.payload.services.filter((_, i) => i !== index) },
    }));
  }

  function updateGalleryItem(index, field, value) {
    setDraft((current) => ({
      ...current,
      payload: {
        ...current.payload,
        gallery: (current.payload.gallery || []).map((item, i) =>
          i === index ? { ...item, [field]: value } : item,
        ),
      },
    }));
  }

  function addGalleryItem() {
    setDraft((current) => ({
      ...current,
      payload: {
        ...current.payload,
        enabledModules: {
          ...defaultEnabledModules,
          ...(current.payload.enabledModules || current.payload.enabled_modules || {}),
          gallery: true,
        },
        gallery: [...(current.payload.gallery || []), { title: '', description: '', image_url: '' }],
      },
    }));
  }

  function removeGalleryItem(index) {
    setDraft((current) => ({
      ...current,
      payload: {
        ...current.payload,
        gallery: (current.payload.gallery || []).filter((_, i) => i !== index),
      },
    }));
  }

  function toggleScheduleDay(day) {
    setDraft((current) => {
      const rules = current.payload.availability_rules || [];
      const exists = rules.some((rule) => Number(rule.weekday) === day);
      const template = rules[0] || { start_time: '08:00', end_time: '18:00', interval_minutes: 30 };
      return {
        ...current,
        payload: {
          ...current.payload,
          availability_rules: exists
            ? rules.filter((rule) => Number(rule.weekday) !== day)
            : [...rules, { weekday: day, start_time: template.start_time, end_time: template.end_time, interval_minutes: template.interval_minutes }]
              .sort((a, b) => Number(a.weekday) - Number(b.weekday)),
        },
      };
    });
  }

  function updateScheduleRule(field, value) {
    setDraft((current) => ({
      ...current,
      payload: {
        ...current.payload,
        availability_rules: (current.payload.availability_rules || []).map((rule) => ({
          ...rule,
          [field]: field === 'interval_minutes' ? Number(value) : value,
        })),
      },
    }));
  }

  function addBreak() {
    setDraft((current) => {
      const activeDays = (current.payload.availability_rules || []).map((rule) => Number(rule.weekday));
      return {
        ...current,
        payload: {
          ...current.payload,
          availability_breaks: [
            ...(current.payload.availability_breaks || []),
            { weekday: activeDays[0] ?? 1, start_time: '12:00', end_time: '13:00', reason: 'Almoço' },
          ],
        },
      };
    });
  }

  function applyBreakToAllActiveDays(index) {
    setDraft((current) => {
      const sourceBreak = (current.payload.availability_breaks || [])[index];
      const activeDays = (current.payload.availability_rules || []).map((rule) => Number(rule.weekday));
      if (!sourceBreak || !activeDays.length) return current;
      const otherBreaks = (current.payload.availability_breaks || []).filter((_, i) => i !== index);
      return {
        ...current,
        payload: {
          ...current.payload,
          availability_breaks: [
            ...otherBreaks,
            ...activeDays.map((weekday) => ({ ...sourceBreak, weekday })),
          ].sort((a, b) => Number(a.weekday) - Number(b.weekday)),
        },
      };
    });
  }

  function updateBreak(index, field, value) {
    setDraft((current) => ({
      ...current,
      payload: {
        ...current.payload,
        availability_breaks: (current.payload.availability_breaks || []).map((item, i) =>
          i === index ? { ...item, [field]: field === 'weekday' ? Number(value) : value } : item,
        ),
      },
    }));
  }

  function removeBreak(index) {
    setDraft((current) => ({
      ...current,
      payload: {
        ...current.payload,
        availability_breaks: (current.payload.availability_breaks || []).filter((_, i) => i !== index),
      },
    }));
  }

  function addDateBlock() {
    setDraft((current) => ({
      ...current,
      payload: {
        ...current.payload,
        availability_date_blocks: [
          ...(current.payload.availability_date_blocks || []),
          { date: new Date().toISOString().slice(0, 10), type: 'holiday', reason: 'Feriado' },
        ],
      },
    }));
  }

  function updateDateBlock(index, field, value) {
    setDraft((current) => ({
      ...current,
      payload: {
        ...current.payload,
        availability_date_blocks: (current.payload.availability_date_blocks || []).map((item, i) =>
          i === index ? { ...item, [field]: value } : item,
        ),
      },
    }));
  }

  function removeDateBlock(index) {
    setDraft((current) => ({
      ...current,
      payload: {
        ...current.payload,
        availability_date_blocks: (current.payload.availability_date_blocks || []).filter((_, i) => i !== index),
      },
    }));
  }

  // ─── Salvar rascunho ────────────────────────────────────────────────────────

  async function saveDraft() {
    if (!draft) return;
    setStatus({ type: 'saving', message: 'Salvando alterações...' });
    const business = draft.payload.businesses || {};
    const branding = draft.payload.business_branding || {};
    const { error } = await supabase
      .from('onboarding_submissions')
      .update({
        business_name: business.name || draft.business_name,
        segment: business.segment || draft.segment,
        whatsapp: business.whatsapp || draft.whatsapp,
        email: business.email || draft.email,
        hero_image_url: branding.hero_image_url || draft.hero_image_url,
        payload: draft.payload,
        status: draft.status === 'published' ? 'published' : 'preview',
      })
      .eq('id', draft.id);

    if (error) { setStatus({ type: 'error', message: error.message }); return; }
    setStatus({ type: 'success', message: 'Alterações salvas. O preview já pode ser atualizado.' });
    await loadSubmissions();
  }

  async function deleteCurrentPage(page) {
    if (!page?.id) return;
    const name = page.payload?.businesses?.name || page.business_name || page.slug;
    if (!window.confirm(`Excluir a página "${name}"? Esta ação não pode ser desfeita.`)) return;

    setStatus({ type: 'saving', message: 'Excluindo página...' });
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    const assetPaths = userId ? collectLandingAssetPaths(page, userId) : [];

    const { error } = await supabase
      .from('onboarding_submissions')
      .delete()
      .eq('id', page.id);

    if (error) {
      setStatus({ type: 'error', message: error.message });
      return;
    }

    if (userId && page.slug) {
      await removePageStorageAssets(`${userId}/${page.slug}`, assetPaths);
    }

    setStatus({ type: 'success', message: 'Página excluída.' });
    setDraft(null);
    setSelectedId('');
    await loadSubmissions();
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const tabTitle = {
    overview: 'Resumo do cadastro',
    testimonials: 'Depoimentos',
    gallery: 'Galeria',
  }[activeTab] || 'Editando cadastro';

  return (
    <div
      className="min-h-screen bg-[var(--preview-bg,#f8fbff)] text-[var(--preview-text,#0b2346)]"
      style={dashboardStyle}
    >
      <header className="border-b border-[var(--preview-border,#fff)] bg-[var(--preview-surface,#fff)]/90 backdrop-blur-xl">
        <nav className="section-shell flex h-20 items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--preview-primary,#1c8dff)] text-white shadow-[var(--preview-glow)]">
              <Settings size={23} />
            </span>
            <span className="text-xl font-extrabold">Dashboard SaaS</span>
          </a>
          {draft && (
            <div className="flex items-center gap-3">
              <a
                href={`/preview/${draft.slug}`}
                target="_blank"
                rel="noreferrer"
                className="pill-button border border-[var(--preview-border)] bg-[var(--preview-card)] text-[var(--preview-text)]"
              >
                Abrir preview
                <ArrowUpRight size={18} />
              </a>
              <button
                type="button"
                onClick={signOut}
                className="grid h-11 w-11 place-items-center rounded-full border border-[var(--preview-border)] bg-[var(--preview-card)] text-[var(--preview-muted)] transition hover:text-[var(--preview-text)]"
                aria-label="Sair"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </nav>
      </header>

      <main className="mx-auto grid w-full max-w-[1680px] gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-[var(--preview-border)] bg-[var(--preview-surface,#fff)] p-5 shadow-[var(--preview-shadow)] sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase text-[var(--preview-primary)]">Suas páginas</p>
              <h1 className="mt-2 text-2xl font-black tracking-[-0.02em]">Gerencie suas páginas criadas</h1>
              <p className="mt-2 text-sm font-semibold text-[var(--preview-muted)]">
                Abra uma página existente, continue editando ou crie uma nova presença com IA.
              </p>
            </div>
            <a href="/onboarding?new=1" className="pill-button bg-[var(--preview-primary,#1c8dff)] text-white shadow-[var(--preview-glow)]">
              <Plus size={18} />
              Nova página
            </a>
          </div>

          {submissions.length ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {submissions.map((item) => {
                const selected = item.id === selectedId;
                const pageName = item.payload?.businesses?.name || item.business_name;
                return (
                  <article
                    key={item.id}
                    className={`rounded-[1.5rem] border p-4 transition ${
                      selected
                        ? 'border-[var(--preview-primary)] bg-[var(--preview-card)] shadow-[var(--preview-shadow)]'
                        : 'border-[var(--preview-border)] bg-[var(--preview-card)]/70 hover:border-[var(--preview-primary)]/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-black">{pageName}</p>
                        <p className="mt-1 truncate text-sm font-bold text-[var(--preview-muted)]">/{item.slug}</p>
                        <span className="mt-3 inline-flex rounded-full border border-[var(--preview-border)] bg-[var(--preview-surface)] px-3 py-1 text-xs font-extrabold text-[var(--preview-muted)]">
                          {item.status}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteCurrentPage(item)}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white"
                        aria-label="Excluir página"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[var(--preview-border)] bg-[var(--preview-surface)] px-3 text-sm font-extrabold text-[var(--preview-text)] transition hover:text-[var(--preview-primary)]"
                      >
                        <Edit3 size={16} />
                        Editar
                      </button>
                      <a
                        href={`/preview/${item.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--preview-primary)] px-3 text-sm font-extrabold text-white shadow-[var(--preview-glow)]"
                      >
                        Abrir
                        <ArrowUpRight size={16} />
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-[var(--preview-border)] bg-[var(--preview-card)] p-8 text-center">
              <p className="text-lg font-black">Você ainda não tem páginas criadas.</p>
              <p className="mt-2 text-sm font-semibold text-[var(--preview-muted)]">
                Crie sua primeira página com IA para começar a editar e publicar.
              </p>
            </div>
          )}
        </section>

        {/* Seletor de cliente + abas */}
        {submissions.length > 0 && (
        <section className="rounded-[2rem] border border-[var(--preview-border)] bg-[var(--preview-surface,#fff)] p-4 shadow-[var(--preview-shadow)]">
          <div className="grid gap-4 xl:grid-cols-[minmax(280px,420px)_1fr] xl:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase text-[var(--preview-primary)]">Cliente ativo</p>
              <select
                value={selectedId}
                onChange={(event) => setSelectedId(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[var(--preview-border)] bg-[var(--preview-card)] px-4 py-3 text-sm font-bold text-[var(--preview-text)] outline-none focus:border-[var(--preview-primary)] focus:ring-4 focus:ring-[var(--preview-primary)]/15"
              >
                {submissions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.business_name} /{item.slug}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
              {TABS.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                    activeTab === key
                      ? 'bg-[var(--preview-primary)] text-white shadow-[var(--preview-glow)]'
                      : 'bg-[var(--preview-card)] text-[var(--preview-muted)] hover:text-[var(--preview-text)]'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* Conteúdo da aba ativa */}
        <section className="rounded-[2rem] border border-[var(--preview-border)] bg-[var(--preview-surface,#fff)] p-5 shadow-[var(--preview-shadow)] sm:p-8">
          {!draft ? (
            <div className="rounded-3xl bg-[var(--preview-card)] p-8 text-center font-bold text-[var(--preview-muted)]">
              Nenhum cliente encontrado.
            </div>
          ) : (
            <>
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-extrabold uppercase text-[var(--preview-primary)]">/{draft.slug}</p>
                  <h1 className="mt-2 text-3xl font-extrabold">
                    {tabTitle}: {draft.payload.businesses.name || draft.business_name}
                  </h1>
                  <p className="mt-2 text-sm font-bold text-[var(--preview-muted)]">Status: {draft.status}</p>
                </div>
                <button
                  onClick={saveDraft}
                  disabled={status.type === 'saving'}
                  className="pill-button bg-[var(--preview-primary)] text-white shadow-[var(--preview-glow)] disabled:opacity-50"
                >
                  <Save size={18} />
                  {status.type === 'saving' ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>

              {status.message && (
                <div className={`mb-6 rounded-3xl p-4 text-sm font-bold ${
                  status.type === 'error'
                    ? 'bg-red-50 text-red-600'
                    : status.type === 'success'
                      ? 'bg-mint-50 text-mint-500'
                      : 'bg-[var(--preview-card)] text-[var(--preview-primary)]'
                }`}>
                  {status.message}
                </div>
              )}

              {activeTab === 'overview' && <Overview draft={draft} />}

              {activeTab === 'appearance' && (
                <AppearanceEditor
                  draft={draft}
                  updateBusiness={updateBusiness}
                  updateBranding={updateBranding}
                  updatePrimaryProfessional={updatePrimaryProfessional}
                  updateEnabledModule={updateEnabledModule}
                />
              )}

              {activeTab === 'services' && (
                <ServicesEditor
                  draft={draft}
                  updateService={updateService}
                  addService={addService}
                  removeService={removeService}
                />
              )}

              {activeTab === 'gallery' && (
                <GalleryEditor
                  draft={draft}
                  updateGalleryItem={updateGalleryItem}
                  addGalleryItem={addGalleryItem}
                  removeGalleryItem={removeGalleryItem}
                />
              )}

              {activeTab === 'testimonials' && (
                <TestimonialsEditor
                  draft={draft}
                  testimonials={testimonials}
                  status={testimonialsStatus}
                  filter={testimonialFilter}
                  form={testimonialForm}
                  editingId={editingTestimonialId}
                  dashboardConfig={dashboardConfig}
                  onFilterChange={setTestimonialFilter}
                  onFormChange={setTestimonialForm}
                  onSave={saveTestimonial}
                  onReset={resetTestimonialForm}
                  onEdit={editTestimonial}
                  onUpdate={updateTestimonial}
                  onDelete={deleteTestimonial}
                />
              )}

              {activeTab === 'agenda' && (
                <AgendaEditor
                  draft={draft}
                  toggleScheduleDay={toggleScheduleDay}
                  updateScheduleRule={updateScheduleRule}
                  addBreak={addBreak}
                  updateBreak={updateBreak}
                  removeBreak={removeBreak}
                  applyBreakToAllActiveDays={applyBreakToAllActiveDays}
                  addDateBlock={addDateBlock}
                  updateDateBlock={updateDateBlock}
                  removeDateBlock={removeDateBlock}
                  updateConversion={updateConversion}
                />
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

// ─── Normalização de dados ────────────────────────────────────────────────────

function normalizeDraft(submission) {
  const payload = submission.payload || {};
  const storedTheme = getStoredPreviewTheme(submission.slug);

  return {
    ...submission,
    payload: {
      ...payload,
      businesses: {
        name: submission.business_name,
        segment: submission.segment,
        whatsapp: submission.whatsapp,
        email: submission.email,
        ...(payload.businesses || {}),
      },
      business_branding: {
        hero_image_url: submission.hero_image_url,
        ...(payload.business_branding || {}),
        ...(storedTheme ? { theme_key: storedTheme } : {}),
      },
      business_locations: payload.business_locations || {},
      services: payload.services || [],
      professionals: payload.professionals || [],
      gallery: normalizeGalleryPayload(payload.gallery || payload.business_media || []),
      availability_rules: payload.availability_rules || [],
      availability_breaks: payload.availability_breaks || [],
      availability_date_blocks: payload.availability_date_blocks || [],
      conversion: payload.conversion || { mode: 'appointment' },
      enabledModules: payload.enabledModules || payload.enabled_modules || defaultEnabledModules,
    },
  };
}

function getStoredPreviewTheme(slug) {
  if (!slug || typeof window === 'undefined') return '';
  return localStorage.getItem(`preview-theme:${slug}`) || '';
}

function normalizeGalleryPayload(items) {
  return (items || []).map((item) => ({
    title: item.title || item.name || '',
    description: item.description || item.alt_text || '',
    image_url: item.image_url || item.url || item.photo_url || '',
  }));
}

async function removePageStorageAssets(prefix, knownPaths = []) {
  const paths = new Set(knownPaths.filter(Boolean));

  if (prefix) {
    const folderPaths = await listStorageFolderPaths(prefix);
    folderPaths.forEach((path) => paths.add(path));
  }

  if (paths.size) {
    await supabase.storage.from('landing-assets').remove([...paths]);
  }
}

async function listStorageFolderPaths(prefix) {
  if (!prefix) return [];

  const { data, error } = await supabase.storage.from('landing-assets').list(prefix, { limit: 100 });
  if (error || !data?.length) return [];

  return data
    .filter((item) => item.name)
    .map((item) => `${prefix}/${item.name}`);
}

function collectLandingAssetPaths(page, userId) {
  const paths = new Set();

  for (const value of collectStringValues(page)) {
    const path = getLandingAssetPath(value, userId);
    if (path) paths.add(path);
  }

  return [...paths];
}

function collectStringValues(value) {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectStringValues);
  if (!value || typeof value !== 'object') return [];
  return Object.values(value).flatMap(collectStringValues);
}

function getLandingAssetPath(fileUrl, userId) {
  if (!fileUrl || !userId) return '';

  try {
    const url = new URL(fileUrl);
    const marker = '/storage/v1/object/public/landing-assets/';
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex === -1) return '';

    const path = decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
    return path.startsWith(`${userId}/`) ? path : '';
  } catch {
    return '';
  }
}

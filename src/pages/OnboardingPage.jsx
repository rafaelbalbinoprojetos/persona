import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  Check,
  Clock3,
  Image,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js';
import { PersonaOnboarding } from '../persona/PersonaOnboarding.jsx';

const segments = [
  'Odontologia',
  'Estética',
  'Barbearia',
  'Salão de beleza',
  'Clínica',
  'Advocacia',
  'Consultoria',
  'Desenvolvimento de sistemas',
  'Arquitetura',
  'Design',
  'Fitness',
  'Outro',
];
const weekdays = [
  { label: 'Seg', value: 1 },
  { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 },
  { label: 'Qui', value: 4 },
  { label: 'Sex', value: 5 },
  { label: 'Sáb', value: 6 },
  { label: 'Dom', value: 0 },
];

const initialForm = {
  businessName: '',
  slug: '',
  segment: 'Odontologia',
  whatsapp: '',
  email: '',
  address: '',
  primaryColor: '#1c8dff',
  heroTitle: '',
  heroSubtitle: '',
  heroImageUrl: '',
  themeKey: 'soft-medical',
  professionalName: '',
  specialty: '',
  signatureTitle: 'Assinatura profissional',
  signatureText: '',
  signatureTags: [],
  trustStats: [],
  editorialHighlight: {
    eyebrow: '',
    title: '',
    description: '',
    benefits: [],
    imageUrl: '',
  },
  instagramUrl: '',
  tiktokUrl: '',
  linkedinUrl: '',
  facebookUrl: '',
  youtubeUrl: '',
  websiteUrl: '',
  services: [
    { name: '', description: '', duration: 30, price: '', image_url: '' },
  ],
  schedule: {
    days: [1, 2, 3, 4, 5],
    startTime: '08:00',
    endTime: '18:00',
    interval: 30,
    breaks: [
      { days: [1, 2, 3, 4, 5], startTime: '12:00', endTime: '13:00', reason: 'Almoço' },
    ],
  },
  conversion: {
    mode: 'appointment',
    title: 'Escolha uma data e horário disponível',
    subtitle: 'O calendário respeita horários, pausas, bloqueios e agendamentos já cadastrados.',
    buttonLabel: 'Solicitar agendamento',
    successMessage: 'Solicitação cadastrada com sucesso. Em breve enviaremos a confirmação.',
    showSchedule: true,
    requestServiceTypes: [],
  },
  faqs: [],
  finalCta: {
    title: 'Pronto para dar o próximo passo?',
    subtitle: '',
    buttonLabel: 'Solicitar atendimento',
  },
};

export default function OnboardingPage() {
  const [entryMode, setEntryMode] = useState('choice');
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [saveState, setSaveState] = useState({ status: 'idle', message: '' });
  const payload = useMemo(() => buildPayload(form), [form]);
  const currentStep = onboardingSteps[step];

  function applyPersonaForm(nextForm) {
    setForm(nextForm);
    setStep(onboardingSteps.length - 1);
    setEntryMode('manual');
    setSaveState({
      status: 'idle',
      message: 'Configuração gerada com IA. Revise os dados antes de salvar no Supabase.',
    });
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'businessName' && !current.slug ? { slug: slugify(value) } : {}),
    }));
  }

  function updateNested(group, field, value) {
    setForm((current) => ({
      ...current,
      [group]: {
        ...current[group],
        [field]: value,
      },
    }));
  }

  function updateArrayItem(group, index, field, value) {
    setForm((current) => ({
      ...current,
      [group]: current[group].map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      )),
    }));
  }

  function addArrayItem(group, item) {
    setForm((current) => ({
      ...current,
      [group]: [...current[group], item],
    }));
  }

  function removeArrayItem(group, index) {
    setForm((current) => ({
      ...current,
      [group]: current[group].filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function toggleDay(day) {
    setForm((current) => {
      const exists = current.schedule.days.includes(day);
      return {
        ...current,
        schedule: {
          ...current.schedule,
          days: exists
            ? current.schedule.days.filter((item) => item !== day)
            : [...current.schedule.days, day].sort((a, b) => a - b),
        },
      };
    });
  }

  function toggleBreakDay(index, day) {
    setForm((current) => ({
      ...current,
      schedule: {
        ...current.schedule,
        breaks: current.schedule.breaks.map((item, itemIndex) => {
          if (itemIndex !== index) return item;
          const exists = item.days.includes(day);
          return {
            ...item,
            days: exists
              ? item.days.filter((breakDay) => breakDay !== day)
              : [...item.days, day].sort((a, b) => a - b),
          };
        }),
      },
    }));
  }

  function updateBreak(index, field, value) {
    setForm((current) => ({
      ...current,
      schedule: {
        ...current.schedule,
        breaks: current.schedule.breaks.map((item, itemIndex) => (
          itemIndex === index ? { ...item, [field]: value } : item
        )),
      },
    }));
  }

  function addBreak() {
    setForm((current) => ({
      ...current,
      schedule: {
        ...current.schedule,
        breaks: [
          ...current.schedule.breaks,
          { days: current.schedule.days, startTime: '12:00', endTime: '13:00', reason: 'Pausa' },
        ],
      },
    }));
  }

  function removeBreak(index) {
    setForm((current) => ({
      ...current,
      schedule: {
        ...current.schedule,
        breaks: current.schedule.breaks.filter((_, itemIndex) => itemIndex !== index),
      },
    }));
  }

  async function handleSave() {
    if (step !== onboardingSteps.length - 1) {
      setStep((current) => Math.min(onboardingSteps.length - 1, current + 1));
      return;
    }

    if (!isSupabaseConfigured) {
      setSaveState({
        status: 'error',
        message: 'Configure VITE_SUPABASE_ANON_KEY no arquivo .env para salvar no Supabase.',
      });
      return;
    }

    if (!form.businessName.trim() || !form.slug.trim()) {
      setSaveState({
        status: 'error',
        message: 'Informe pelo menos o nome do negócio e o slug da página.',
      });
      return;
    }

    setSaveState({ status: 'saving', message: 'Salvando configuração no Supabase…' });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setSaveState({
        status: 'error',
        message: 'Faça login novamente para salvar esta configuração.',
      });
      return;
    }

    const { error } = await supabase
      .from('onboarding_submissions')
      .insert({
        owner_id: userData.user.id,
        business_name: form.businessName,
        slug: form.slug,
        segment: form.segment,
        whatsapp: form.whatsapp,
        email: form.email,
        hero_image_url: form.heroImageUrl,
        payload,
        status: 'new',
      });

    if (error) {
      setSaveState({
        status: 'error',
        message: error.message,
      });
      return;
    }

    setSaveState({
      status: 'success',
      message: `Configuração salva com sucesso. Acesse /preview/${form.slug} para visualizar a página do cliente.`,
    });
  }

  if (entryMode === 'choice') {
    return (
      <PersonaOnboarding
        initialForm={initialForm}
        onApply={applyPersonaForm}
        onManual={() => setEntryMode('manual')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fbff]">
      <header className="border-b border-white bg-white/85 backdrop-blur-xl">
        <nav className="section-shell flex h-20 items-center justify-between">
          <a href="/" className="flex items-center gap-3 text-brand-900">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-600 text-white shadow-glow">
              <CalendarCheck size={23} />
            </span>
            <span className="text-xl font-extrabold">Persona</span>
          </a>
          <div className="flex items-center gap-5">
            <button onClick={() => setEntryMode('choice')} className="hidden text-sm font-bold text-brand-600 sm:inline-flex">
              Criar com IA
            </button>
            <a href="/demo/personapro" className="hidden text-sm font-bold text-brand-600 sm:inline-flex">Ver demo</a>
          </div>
        </nav>
      </header>

      <main className="section-shell py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <aside className="h-fit rounded-[2rem] bg-white p-5 shadow-soft lg:sticky lg:top-8">
            <p className="text-sm font-extrabold uppercase text-brand-600">Configuração inicial</p>
            <h1 className="mt-3 text-2xl font-extrabold leading-tight text-brand-900">Crie a primeira página do cliente</h1>
            <div className="mt-7 space-y-3">
              {onboardingSteps.map((item, index) => (
                <button
                  key={item.title}
                  onClick={() => setStep(index)}
                  className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${
                    step === index ? 'bg-brand-600 text-white shadow-glow' : 'bg-[#f8fbff] text-slate-600 hover:bg-brand-50'
                  }`}
                >
                  <span className={`grid h-9 w-9 place-items-center rounded-full text-sm font-extrabold ${step === index ? 'bg-white text-brand-700' : 'bg-white text-brand-600'}`}>
                    {index + 1}
                  </span>
                  <span className="font-bold">{item.title}</span>
                </button>
              ))}
            </div>
          </aside>

          <section className="rounded-[2rem] bg-white p-5 shadow-soft sm:p-8">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-extrabold uppercase text-brand-600">Etapa {step + 1} de {onboardingSteps.length}</p>
                <h2 className="mt-2 text-3xl font-extrabold text-brand-900">{currentStep.title}</h2>
                <p className="mt-2 leading-7 text-slate-600">{currentStep.description}</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-mint-50 px-4 py-2 text-sm font-bold text-mint-500">
                <Check size={17} />
                Dados locais
              </span>
            </div>

            {step === 0 && (
              <div className="grid gap-5 sm:grid-cols-2">
                <Input label="Nome do negócio" value={form.businessName} onChange={(value) => updateField('businessName', value)} placeholder="Ex: Studio Bella" />
                <Input label="Slug da página" value={form.slug} onChange={(value) => updateField('slug', slugify(value))} placeholder="studio-bella" prefix="/" />
                <Select label="Segmento" value={form.segment} onChange={(value) => updateField('segment', value)} options={segments} />
                <Input label="WhatsApp" value={form.whatsapp} onChange={(value) => updateField('whatsapp', formatPhone(value))} placeholder="(11) 99999-9999" />
                <Input label="E-mail" value={form.email} onChange={(value) => updateField('email', value)} placeholder="contato@empresa.com" />
                <Input label="Endereço" value={form.address} onChange={(value) => updateField('address', value)} placeholder="Rua, número, cidade" />
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input label="Nome do profissional" value={form.professionalName} onChange={(value) => updateField('professionalName', value)} placeholder="Ex: Dra. Joana Silva" />
                  <Input label="Especialidade" value={form.specialty} onChange={(value) => updateField('specialty', value)} placeholder="Odontologia estética" />
                </div>
                <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
                  <label className="rounded-3xl border border-slate-100 bg-[#fbfdff] p-4">
                    <span className="text-xs font-bold uppercase text-slate-400">Cor principal</span>
                    <input
                      type="color"
                      value={form.primaryColor}
                      onChange={(event) => updateField('primaryColor', event.target.value)}
                      className="mt-3 h-14 w-full cursor-pointer rounded-2xl border border-slate-100 bg-white p-2"
                    />
                  </label>
                  <Input label="URL da imagem principal" value={form.heroImageUrl} onChange={(value) => updateField('heroImageUrl', value)} placeholder="https://..." icon={<Image size={18} />} />
                </div>
                <Input label="Título da hero" value={form.heroTitle} onChange={(value) => updateField('heroTitle', value)} placeholder="Cuidamos de você com excelência" />
                <Textarea label="Subtítulo da hero" value={form.heroSubtitle} onChange={(value) => updateField('heroSubtitle', value)} placeholder="Descreva a promessa principal do negócio." />
                <Textarea label="Assinatura profissional" value={form.signatureText} onChange={(value) => updateField('signatureText', value)} placeholder="Descreva a filosofia, método ou diferencial do profissional." />
                <div className="rounded-[2rem] border border-slate-100 bg-[#fbfdff] p-5">
                  <h3 className="text-xl font-extrabold text-brand-900">Presença social</h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                    Links usados na hero, CTA final e footer da página pública.
                  </p>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <Input label="Instagram" value={form.instagramUrl} onChange={(value) => updateField('instagramUrl', value)} placeholder="@usuário ou URL" />
                    <Input label="TikTok" value={form.tiktokUrl} onChange={(value) => updateField('tiktokUrl', value)} placeholder="@usuário ou URL" />
                    <Input label="LinkedIn" value={form.linkedinUrl} onChange={(value) => updateField('linkedinUrl', value)} placeholder="https://linkedin.com/in/..." />
                    <Input label="Facebook" value={form.facebookUrl} onChange={(value) => updateField('facebookUrl', value)} placeholder="https://facebook.com/..." />
                    <Input label="YouTube" value={form.youtubeUrl} onChange={(value) => updateField('youtubeUrl', value)} placeholder="https://youtube.com/..." />
                    <Input label="Site profissional" value={form.websiteUrl} onChange={(value) => updateField('websiteUrl', value)} placeholder="https://seudominio.com" />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <ArrayEditor
                title="Serviços"
                items={form.services}
                addLabel="Adicionar serviço"
                onAdd={() => addArrayItem('services', { name: '', description: '', duration: 30, price: '', image_url: '' })}
                onRemove={(index) => removeArrayItem('services', index)}
                renderItem={(service, index) => (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Nome do serviço" value={service.name} onChange={(value) => updateArrayItem('services', index, 'name', value)} placeholder="Limpeza de pele" icon={<Sparkles size={18} />} />
                    <Input label="Preço" value={service.price} onChange={(value) => updateArrayItem('services', index, 'price', value)} placeholder="150,00" />
                    <Input label="Duração em minutos" value={service.duration} onChange={(value) => updateArrayItem('services', index, 'duration', Number(value))} placeholder="30" type="number" />
                    <Input label="Descrição" value={service.description} onChange={(value) => updateArrayItem('services', index, 'description', value)} placeholder="Descrição curta do serviço" />
                    <div className="sm:col-span-2">
                      <Input label="URL da imagem do serviço" value={service.image_url} onChange={(value) => updateArrayItem('services', index, 'image_url', value)} placeholder="https://..." icon={<Image size={18} />} />
                    </div>
                  </div>
                )}
              />
            )}

            {step === 3 && (
              <div className="grid gap-6">
                <div>
                  <p className="mb-3 text-sm font-bold text-slate-500">Dias de atendimento</p>
                  <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
                    {weekdays.map((day) => {
                      const active = form.schedule.days.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          onClick={() => toggleDay(day.value)}
                          className={`rounded-2xl px-4 py-4 text-sm font-extrabold transition ${active ? 'bg-brand-600 text-white shadow-glow' : 'bg-[#f8fbff] text-brand-900 hover:bg-brand-50'}`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-3">
                  <Input label="Início" value={form.schedule.startTime} onChange={(value) => updateNested('schedule', 'startTime', value)} type="time" icon={<Clock3 size={18} />} />
                  <Input label="Fim" value={form.schedule.endTime} onChange={(value) => updateNested('schedule', 'endTime', value)} type="time" icon={<Clock3 size={18} />} />
                  <Select label="Intervalo" value={String(form.schedule.interval)} onChange={(value) => updateNested('schedule', 'interval', Number(value))} options={['15', '30', '45', '60']} />
                </div>
                <div className="rounded-[2rem] border border-slate-100 bg-[#fbfdff] p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-xl font-extrabold text-brand-900">Pausas e bloqueios</h3>
                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                        Configure almoço, café, reuniões ou qualquer período indisponível.
                      </p>
                    </div>
                    <button onClick={addBreak} className="pill-button bg-brand-50 px-4 py-2 text-brand-700 hover:bg-brand-600 hover:text-white">
                      <Plus size={17} />
                      Adicionar pausa
                    </button>
                  </div>

                  <div className="mt-5 space-y-4">
                    {form.schedule.breaks.map((breakItem, index) => (
                      <div key={`${breakItem.startTime}-${breakItem.endTime}-${index}`} className="rounded-3xl bg-white p-4 shadow-sm">
                        <div className="mb-4 flex items-center justify-between gap-4">
                          <p className="text-sm font-extrabold text-brand-600">Bloqueio {index + 1}</p>
                          {form.schedule.breaks.length > 1 && (
                            <button onClick={() => removeBreak(index)} className="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-red-500 hover:bg-red-100" aria-label="Remover pausa">
                              <Trash2 size={17} />
                            </button>
                          )}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                          <Input label="Início da pausa" value={breakItem.startTime} onChange={(value) => updateBreak(index, 'startTime', value)} type="time" />
                          <Input label="Fim da pausa" value={breakItem.endTime} onChange={(value) => updateBreak(index, 'endTime', value)} type="time" />
                          <Input label="Motivo" value={breakItem.reason} onChange={(value) => updateBreak(index, 'reason', value)} placeholder="Almoço, café…" />
                        </div>
                        <div className="mt-4">
                          <p className="mb-3 text-sm font-bold text-slate-500">Dias bloqueados</p>
                          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                            {weekdays.map((day) => {
                              const active = breakItem.days.includes(day.value);
                              return (
                                <button
                                  key={day.value}
                                  onClick={() => toggleBreakDay(index, day.value)}
                                  className={`rounded-2xl px-3 py-3 text-sm font-extrabold transition ${active ? 'bg-brand-600 text-white' : 'bg-[#f8fbff] text-brand-900 hover:bg-brand-50'}`}
                                >
                                  {day.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
                <div className="rounded-3xl bg-[#f8fbff] p-5">
                  <h3 className="text-xl font-extrabold text-brand-900">{form.businessName || 'Nome do negócio'}</h3>
                  <p className="mt-2 text-sm font-bold text-brand-600">/{form.slug || 'slug-da-pagina'}</p>
                  <p className="mt-4 leading-7 text-slate-600">{form.heroSubtitle || 'Subtítulo da página pública.'}</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <Summary label="Segmento" value={form.segment} />
                    <Summary label="WhatsApp" value={form.whatsapp || 'Não informado'} />
                    <Summary label="Serviços" value={`${form.services.filter((item) => item.name).length} cadastrados`} />
                    <Summary label="Modelo" value="Profissional único" />
                  </div>
                </div>
                <pre className="max-h-[420px] overflow-auto rounded-3xl bg-brand-900 p-5 text-xs leading-6 text-brand-50">
                  {JSON.stringify(payload, null, 2)}
                </pre>
              </div>
            )}

            {saveState.message && (
              <div
                className={`mt-8 rounded-3xl p-5 text-sm font-bold leading-6 ${
                  saveState.status === 'success'
                    ? 'bg-mint-50 text-mint-500'
                    : saveState.status === 'saving'
                      ? 'bg-brand-50 text-brand-700'
                      : 'bg-red-50 text-red-600'
                }`}
              >
                <p>{saveState.message}</p>
                {saveState.status === 'success' && (
                  <a href={`/preview/${form.slug}`} className="mt-3 inline-flex text-sm underline">
                    Abrir preview do cliente
                  </a>
                )}
              </div>
            )}

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={() => setStep((current) => Math.max(0, current - 1))}
                disabled={step === 0}
                className="pill-button border border-slate-200 bg-white text-brand-900 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                <ArrowLeft size={18} />
                Voltar
              </button>
              <button
                onClick={handleSave}
                disabled={saveState.status === 'saving'}
                className="pill-button bg-brand-600 text-white shadow-glow hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                {step === onboardingSteps.length - 1
                  ? saveState.status === 'saving' ? 'Salvando...' : 'Salvar'
                  : 'Continuar'}
                <ArrowRight size={18} />
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

const onboardingSteps = [
  { title: 'Negócio', description: 'Dados principais para criar o tenant e a URL pública.' },
  { title: 'Marca', description: 'Identidade visual inicial da página pública.' },
  { title: 'Serviços', description: 'O que o cliente oferece, com duração e preço opcional.' },
  { title: 'Agenda', description: 'Dias, horários e intervalo padrão de disponibilidade.' },
  { title: 'Resumo', description: 'Payload preparado para gravar nas tabelas do Supabase.' },
];

function Input({ label, value, onChange, placeholder, type = 'text', prefix, icon }) {
  return (
    <label className="block rounded-3xl border border-slate-100 bg-[#fbfdff] p-4">
      <span className="mb-3 flex items-center gap-2 text-xs font-bold uppercase text-slate-400">
        {icon}
        {label}
      </span>
      <div className="flex items-center rounded-2xl border border-slate-100 bg-white focus-within:border-brand-200 focus-within:ring-4 focus-within:ring-brand-50">
        {prefix && <span className="pl-4 text-sm font-bold text-slate-400">{prefix}</span>}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl bg-transparent px-4 py-3 text-sm font-bold text-brand-900 outline-none placeholder:text-slate-300"
        />
      </div>
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  const normalizedOptions = options.includes(value) ? options : [value, ...options].filter(Boolean);

  return (
    <label className="block rounded-3xl border border-slate-100 bg-[#fbfdff] p-4">
      <span className="mb-3 block text-xs font-bold uppercase text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold text-brand-900 outline-none focus:border-brand-200 focus:ring-4 focus:ring-brand-50"
      >
        {normalizedOptions.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function Textarea({ label, value, onChange, placeholder }) {
  return (
    <label className="block rounded-3xl border border-slate-100 bg-[#fbfdff] p-4">
      <span className="mb-3 block text-xs font-bold uppercase text-slate-400">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full resize-none rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold leading-6 text-brand-900 outline-none placeholder:text-slate-300 focus:border-brand-200 focus:ring-4 focus:ring-brand-50"
      />
    </label>
  );
}

function ArrayEditor({ title, items, addLabel, onAdd, onRemove, renderItem }) {
  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <h3 className="text-xl font-extrabold text-brand-900">{title}</h3>
        <button onClick={onAdd} className="pill-button bg-brand-50 px-4 py-2 text-brand-700 hover:bg-brand-600 hover:text-white">
          <Plus size={17} />
          {addLabel}
        </button>
      </div>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={item.name || item.id || `item-${index}`} className="rounded-[2rem] border border-slate-100 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-extrabold text-brand-600">Item {index + 1}</p>
              {items.length > 1 && (
                <button onClick={() => onRemove(index)} className="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-red-500 hover:bg-red-100" aria-label="Remover item">
                  <Trash2 size={17} />
                </button>
              )}
            </div>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

function Summary({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-2 font-extrabold text-brand-900">{value}</p>
    </div>
  );
}

function buildPayload(form) {
  return {
    businesses: {
      name: form.businessName,
      slug: form.slug,
      segment: form.segment.toLowerCase(),
      whatsapp: form.whatsapp,
      email: form.email,
      instagram_url: form.instagramUrl,
      tiktok_url: form.tiktokUrl,
      linkedin_url: form.linkedinUrl,
      facebook_url: form.facebookUrl,
      youtube_url: form.youtubeUrl,
      website_url: form.websiteUrl,
      status: 'trial',
    },
    business_branding: {
      primary_color: form.primaryColor,
      theme_key: form.themeKey,
      hero_title: form.heroTitle,
      hero_subtitle: form.heroSubtitle,
      hero_image_url: form.heroImageUrl,
      hero_badge: form.specialty || form.segment,
      cta_primary_text: form.conversion.buttonLabel,
      cta_secondary_text: 'Conhecer assinatura profissional',
    },
    business_locations: {
      name: 'Unidade principal',
      address: form.address,
      is_main: true,
    },
    services: form.services.filter((service) => service.name),
    trustStats: form.trustStats || [],
    editorialHighlight: form.editorialHighlight || {},
    professionals: form.businessName ? [{
      name: form.professionalName || form.businessName,
      specialty: form.specialty || form.segment,
      bio: form.signatureText,
    }] : [],
    availability_rules: form.schedule.days.map((weekday) => ({
      weekday,
      start_time: form.schedule.startTime,
      end_time: form.schedule.endTime,
      interval_minutes: form.schedule.interval,
    })),
    availability_breaks: form.schedule.breaks.flatMap((breakItem) => (
      breakItem.days.map((weekday) => ({
        weekday,
        start_time: breakItem.startTime,
        end_time: breakItem.endTime,
        reason: breakItem.reason,
      }))
    )),
    conversion: {
      ...form.conversion,
    },
    faqs: form.faqs,
    finalCta: form.finalCta,
    socials: {
      instagram: form.instagramUrl,
      tiktok: form.tiktokUrl,
      linkedin: form.linkedinUrl,
      facebook: form.facebookUrl,
      youtube: form.youtubeUrl,
      website: form.websiteUrl,
    },
    enabledModules: {
      hero: true,
      trustStats: true,
      services: true,
      editorialHighlight: true,
      professionals: false,
      schedule: true,
      testimonials: false,
      faq: form.faqs.length > 0,
      gallery: false,
      location: true,
      finalCta: true,
    },
  };
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 2) return digits ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

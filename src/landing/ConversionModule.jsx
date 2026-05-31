import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BriefcaseBusiness, Mail, MessageCircle, Phone, Sparkles, UserRound } from 'lucide-react';
import { cardClass } from './theme.js';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js';
import { ScheduleModule } from './ScheduleModule.jsx';
import { ReservationPeriodModule } from './ReservationPeriodModule.jsx';
import { SectionIntro, reveal } from './LandingShared.jsx';

export function ConversionModule({ config, theme }) {
  const mode = config.conversion?.mode || 'appointment';

  if (mode === 'appointment') {
    return <CalendarModule config={config} theme={theme} />;
  }

  if (mode === 'consultation' && config.conversion.showSchedule) {
    return <CalendarModule config={config} theme={theme} />;
  }

  return (
    <section id="agenda" className="bg-[var(--preview-section)] py-24">
      <div className="section-shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <ConversionIntro config={config} />
        <div className={cardClass(theme, 'p-5 shadow-[var(--preview-shadow)]')} style={{ borderRadius: theme.radius }}>
          {mode === 'request' && <RequestForm config={config} theme={theme} />}
          {mode === 'consultation' && <ConsultationForm config={config} theme={theme} />}
          {mode === 'lead' && <LeadForm config={config} theme={theme} />}
        </div>
      </div>
    </section>
  );
}

function CalendarModule({ config, theme }) {
  return config.conversion?.calendarMode === 'date_range'
    ? <ReservationPeriodModule config={config} theme={theme} />
    : <ScheduleModule config={config} theme={theme} />;
}

function ConversionIntro({ config }) {
  const { conversion, business, submission, location } = config;
  return (
    <div>
      <SectionIntro
        eyebrow={getConversionEyebrow(conversion.mode)}
        title={conversion.title}
        description={conversion.subtitle}
        align="left"
      />
      <div className="mt-8 space-y-4 text-[var(--preview-muted)]">
        <Contact icon={<Phone size={19} />} text={business.whatsapp || submission.whatsapp || 'WhatsApp não informado'} />
        <Contact icon={<Mail size={19} />} text={business.email || submission.email || 'E-mail não informado'} />
        {location.address && <Contact icon={<BriefcaseBusiness size={19} />} text={location.address} />}
      </div>
    </div>
  );
}

function RequestForm({ config, theme }) {
  return (
    <ConversionForm
      config={config}
      theme={theme}
      mode="request"
      initialPayload={{
        service_type: '',
        estimated_budget: '',
        desired_deadline: '',
        description: '',
      }}
      renderFields={({ values, update }) => (
        <>
          <SelectField
            icon={<Sparkles size={16} />}
            label="Tipo de serviço"
            value={values.service_type}
            onChange={(value) => update('service_type', value)}
            options={config.conversion.requestServiceTypes}
            fallback="Selecione uma opção"
          />
          <TextField
            icon={<BriefcaseBusiness size={16} />}
            label="Orçamento estimado"
            value={values.estimated_budget}
            onChange={(value) => update('estimated_budget', value)}
            placeholder="Ex: até R$ 5.000,00"
          />
          <TextField
            icon={<MessageCircle size={16} />}
            label="Prazo desejado"
            value={values.desired_deadline}
            onChange={(value) => update('desired_deadline', value)}
            placeholder="Ex: 30 dias, este mês, sem prazo definido"
          />
          <TextareaField
            label="Descrição da necessidade"
            value={values.description}
            onChange={(value) => update('description', value)}
            placeholder="Conte sobre o projeto, problema, processo atual ou objetivo."
          />
        </>
      )}
    />
  );
}

function ConsultationForm({ config, theme }) {
  return (
    <ConversionForm
      config={config}
      theme={theme}
      mode="consultation"
      initialPayload={{
        meeting_type: '',
        meeting_format: config.conversion.meetingFormats?.[0] || 'Online',
        meeting_goal: '',
      }}
      renderFields={({ values, update }) => (
        <>
          <TextField
            icon={<Sparkles size={16} />}
            label="Tipo de reunião"
            value={values.meeting_type}
            onChange={(value) => update('meeting_type', value)}
            placeholder="Ex: análise inicial, estratégia, mentoria"
          />
          <SelectField
            icon={<MessageCircle size={16} />}
            label="Formato"
            value={values.meeting_format}
            onChange={(value) => update('meeting_format', value)}
            options={config.conversion.meetingFormats}
            fallback="Selecione o formato"
          />
          <TextareaField
            label="Objetivo da reunião"
            value={values.meeting_goal}
            onChange={(value) => update('meeting_goal', value)}
            placeholder="Explique o que você deseja resolver, avaliar ou planejar."
          />
        </>
      )}
    />
  );
}

function LeadForm({ config, theme }) {
  return (
    <ConversionForm
      config={config}
      theme={theme}
      mode="lead"
      initialPayload={{ message: '' }}
      renderFields={({ values, update }) => (
        <TextareaField
          label="Mensagem"
          value={values.message}
          onChange={(value) => update('message', value)}
          placeholder="Escreva sua mensagem para o profissional."
        />
      )}
    />
  );
}

function ConversionForm({ config, theme, mode, initialPayload, renderFields }) {
  const [base, setBase] = useState({ name: '', whatsapp: '', email: '' });
  const [values, setValues] = useState(initialPayload);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const whatsappDigits = onlyDigits(base.whatsapp);
  const canSubmit = base.name.trim().length >= 3 && whatsappDigits.length >= 10;

  function updateBase(field, value) {
    setStatus('idle');
    setMessage('');
    setBase((current) => ({ ...current, [field]: value }));
  }

  function update(field, value) {
    setStatus('idle');
    setMessage('');
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function submit() {
    if (!canSubmit) {
      setStatus('error');
      setMessage('Informe seu nome e um WhatsApp válido com DDD.');
      return;
    }

    if (!isSupabaseConfigured) {
      setStatus('error');
      setMessage('Supabase não configurado. Não foi possível enviar a solicitação.');
      return;
    }

    setStatus('saving');
    const { error } = await supabase.from('conversion_requests').insert({
      submission_slug: config.submission.slug,
      business_name: config.business.name || config.submission.business_name,
      conversion_mode: mode,
      customer_name: base.name.trim(),
      customer_whatsapp: whatsappDigits,
      customer_email: base.email.trim() || null,
      status: 'new',
      source: 'preview_landing',
      payload: values,
    });

    if (error) {
      setStatus('error');
      const missingTable = error.code === '42P01' || error.code === 'PGRST205';
      setMessage(
        missingTable
          ? 'Tabela de solicitações ainda não encontrada. Execute supabase/conversion_requests.sql no SQL Editor.'
          : error.message || 'Não foi possível enviar a solicitação.',
      );
      return;
    }

    setStatus('success');
    setMessage(config.conversion.successMessage);
    setBase({ name: '', whatsapp: '', email: '' });
    setValues(initialPayload);
  }

  return (
    <motion.div variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          icon={<UserRound size={16} />}
          label="Nome"
          value={base.name}
          onChange={(value) => updateBase('name', value)}
          placeholder="Seu nome completo"
        />
        <TextField
          icon={<Phone size={16} />}
          label="WhatsApp com DDD"
          value={base.whatsapp}
          onChange={(value) => updateBase('whatsapp', value)}
          placeholder="(11) 99999-9999"
        />
        <TextField
          icon={<Mail size={16} />}
          label="E-mail opcional"
          value={base.email}
          onChange={(value) => updateBase('email', value)}
          placeholder="voce@email.com"
          className="sm:col-span-2"
        />
        {renderFields({ values, update })}
      </div>

      {message && (
        <p
          className={`mt-4 rounded-2xl p-4 text-sm font-extrabold ${
            status === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
          }`}
        >
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={status === 'saving'}
        className="pill-button mt-6 w-full text-white shadow-[var(--preview-glow)] hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ backgroundColor: theme.primary }}
      >
        {status === 'saving' ? 'Enviando...' : config.conversion.buttonLabel}
        <ArrowRight size={18} />
      </button>
    </motion.div>
  );
}

function TextField({ icon, label, value, placeholder, onChange, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase text-[var(--preview-muted)]">
        {icon}
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-[var(--preview-border)] bg-[var(--preview-surface)] px-4 text-sm font-bold text-[var(--preview-text)] outline-none transition placeholder:text-[var(--preview-muted)] focus:border-[var(--preview-primary)]"
      />
    </label>
  );
}

function SelectField({ icon, label, value, onChange, options = [], fallback }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase text-[var(--preview-muted)]">
        {icon}
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-[var(--preview-border)] bg-[var(--preview-surface)] px-4 text-sm font-bold text-[var(--preview-text)] outline-none transition focus:border-[var(--preview-primary)]"
      >
        <option value="">{fallback}</option>
        {(options || []).map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function TextareaField({ label, value, placeholder, onChange }) {
  return (
    <label className="block sm:col-span-2">
      <span className="mb-2 block text-xs font-extrabold uppercase text-[var(--preview-muted)]">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={5}
        className="w-full resize-none rounded-2xl border border-[var(--preview-border)] bg-[var(--preview-surface)] px-4 py-3 text-sm font-bold leading-6 text-[var(--preview-text)] outline-none transition placeholder:text-[var(--preview-muted)] focus:border-[var(--preview-primary)]"
      />
    </label>
  );
}

function Contact({ icon, text }) {
  return (
    <div className="flex items-center gap-3 font-bold">
      <span className="text-[var(--preview-primary)]">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function getConversionEyebrow(mode) {
  return {
    appointment: 'Agenda online',
    request: 'Solicitação',
    consultation: 'Consultoria',
    lead: 'Contato',
  }[mode] || 'Atendimento';
}

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

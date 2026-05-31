import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Phone, Sparkles, UserRound } from 'lucide-react';
import { cardClass } from './theme.js';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js';
import {
  buildCalendarDays,
  dateFormatter,
  formatDateKey,
  isBeforeDay,
  isSameMonth,
  monthFormatter,
  shortWeekdays,
  startOfDay,
} from './dateUtils.js';
import { SectionIntro } from './LandingShared.jsx';
import { SmartContactList } from './EditablePrimitives.jsx';

export function ReservationPeriodModule({ config, theme, editMode = false, onEditContact }) {
  const { submission, business, location, availability, availabilityDateBlocks, preset } = config;
  const today = useMemo(() => startOfDay(new Date()), []);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [customerWhatsApp, setCustomerWhatsApp] = useState('');
  const [details, setDetails] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [bookedRanges, setBookedRanges] = useState([]);
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const selectedDates = useMemo(() => enumerateDates(startDate, endDate || startDate), [endDate, startDate]);
  const selectedDateKeys = useMemo(() => new Set(selectedDates.map(formatDateKey)), [selectedDates]);
  const whatsappDigits = onlyDigits(customerWhatsApp);
  const canSubmit = Boolean(startDate && endDate && selectedDates.length && customerName.trim().length >= 3 && whatsappDigits.length >= 10);

  useEffect(() => {
    async function loadBookedRanges() {
      if (!isSupabaseConfigured) return;
      const { data, error } = await supabase
        .from('public_reservation_ranges')
        .select('submission_slug, start_date, end_date')
        .eq('submission_slug', submission.slug);
      if (!error) setBookedRanges(data || []);
    }
    loadBookedRanges();
  }, [submission.slug]);

  function isUnavailable(date) {
    if (!date || isBeforeDay(date, today)) return true;
    const key = formatDateKey(date);
    const weekdayAllowed = availability.some((rule) => Number(rule.weekday) === date.getDay());
    const manuallyBlocked = availabilityDateBlocks.some((item) => item.date === key);
    const alreadyBooked = bookedRanges.some((range) => key >= range.start_date && key <= range.end_date);
    return !weekdayAllowed || manuallyBlocked || alreadyBooked;
  }

  function selectDate(date) {
    clearFeedback();
    if (!startDate || endDate || date < startDate) {
      setStartDate(date);
      setEndDate(null);
      return;
    }

    const range = enumerateDates(startDate, date);
    if (range.some(isUnavailable)) {
      setStatus('error');
      setMessage('O período inclui uma data indisponível. Escolha outro intervalo.');
      return;
    }
    setEndDate(date);
  }

  async function submitReservation() {
    if (!canSubmit) {
      setStatus('error');
      setMessage('Escolha a data inicial e final e informe seu nome e WhatsApp com DDD.');
      return;
    }
    if (!isSupabaseConfigured) {
      setStatus('error');
      setMessage('Supabase não configurado. Não foi possível solicitar a reserva.');
      return;
    }

    setStatus('saving');
    setMessage('');
    const startKey = formatDateKey(startDate);
    const endKey = formatDateKey(endDate);
    const { error } = await supabase.from('reservation_requests').insert({
      submission_slug: submission.slug,
      business_name: business.name || submission.business_name,
      customer_name: customerName.trim(),
      customer_whatsapp: whatsappDigits,
      start_date: startKey,
      end_date: endKey,
      status: 'pending',
      source: 'preview_landing',
      payload: { details: details.trim() || 'Não informado' },
    });

    if (error) {
      setStatus('error');
      const missingTable = error.code === '42P01' || error.code === 'PGRST205';
      const overlap = error.code === '23P01';
      setMessage(
        missingTable
          ? 'Tabela de reservas não encontrada. Execute supabase/reservation_requests.sql no SQL Editor.'
          : overlap
            ? 'Este período acabou de ser reservado. Escolha outras datas.'
            : error.message || 'Não foi possível solicitar a reserva.',
      );
      return;
    }

    setBookedRanges((current) => [...current, { submission_slug: submission.slug, start_date: startKey, end_date: endKey }]);
    setStatus('success');
    setMessage('Reserva solicitada com sucesso. Em breve enviaremos a confirmação.');
  }

  function clearFeedback() {
    if (status === 'idle' || status === 'saving') return;
    setStatus('idle');
    setMessage('');
  }

  return (
    <section id="agenda" className="bg-[var(--preview-section)] py-24">
      <div className="section-shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <SectionIntro
            eyebrow={preset.sectionLabels.schedule}
            title={config.conversion?.title || 'Escolha o período da reserva'}
            description={config.conversion?.subtitle || 'Selecione a data inicial e final para consultar a disponibilidade do espaço.'}
            align="left"
          />
          <div className="mt-8"><SmartContactList whatsapp={business.whatsapp || submission.whatsapp} email={business.email || submission.email} address={location.address} isOwner={editMode} onEditField={onEditContact} /></div>
        </div>

        <div className={cardClass(theme, 'p-5 shadow-[var(--preview-shadow)]')} style={{ borderRadius: theme.radius }}>
          <div className="rounded-3xl border border-[var(--preview-border)] bg-[var(--preview-card)] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <button type="button" onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} disabled={isSameMonth(visibleMonth, today)} className="grid h-10 w-10 place-items-center rounded-full bg-[var(--preview-surface)] disabled:opacity-35" aria-label="Mês anterior">
                <ChevronLeft size={18} />
              </button>
              <p className="text-center text-sm font-extrabold capitalize">{monthFormatter.format(visibleMonth)}</p>
              <button type="button" onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} className="grid h-10 w-10 place-items-center rounded-full bg-[var(--preview-surface)]" aria-label="Próximo mês">
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {shortWeekdays.map((weekday) => <span key={weekday} className="py-2 text-center text-xs font-extrabold uppercase text-[var(--preview-muted)]">{weekday}</span>)}
              {calendarDays.map((day, index) => {
                const disabled = !day || isUnavailable(day);
                const key = day ? formatDateKey(day) : '';
                const selected = selectedDateKeys.has(key);
                return (
                  <button
                    key={day ? day.toISOString() : `empty-${index}`}
                    type="button"
                    disabled={disabled}
                    onClick={() => day && selectDate(day)}
                    className={`aspect-square rounded-2xl text-sm font-extrabold transition ${
                      disabled
                        ? 'cursor-not-allowed text-[var(--preview-muted)] opacity-30'
                        : selected
                          ? 'text-white shadow-[var(--preview-glow)]'
                          : 'bg-[var(--preview-surface)] text-[var(--preview-text)] hover:-translate-y-1'
                    }`}
                    style={selected ? { backgroundColor: theme.primary } : undefined}
                  >
                    {day?.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 grid gap-3 rounded-3xl border border-[var(--preview-border)] bg-[var(--preview-card)] p-4 sm:grid-cols-2">
            <DateSummary label="Data inicial" date={startDate} />
            <DateSummary label="Data final" date={endDate} />
            <p className="text-sm font-bold text-[var(--preview-muted)] sm:col-span-2">
              {startDate && !endDate ? 'Agora selecione a data final.' : `${selectedDates.length || 0} dia(s) selecionado(s).`}
            </p>
          </div>

          <div className="mt-5 grid gap-4 rounded-3xl border border-[var(--preview-border)] bg-[var(--preview-card)] p-4 sm:grid-cols-2">
            <PeriodInput icon={<UserRound size={16} />} label="Nome" value={customerName} placeholder="Seu nome completo" onChange={setCustomerName} />
            <PeriodInput icon={<Phone size={16} />} label="WhatsApp com DDD" value={customerWhatsApp} placeholder="(11) 99999-9999" onChange={setCustomerWhatsApp} />
            <div className="sm:col-span-2">
              <PeriodInput icon={<Sparkles size={16} />} label="Detalhes da reserva" value={details} placeholder="Ex: fim de semana em família, evento, quantidade de pessoas" onChange={setDetails} />
            </div>
          </div>

          {message && <p className={`mt-4 rounded-2xl p-4 text-sm font-extrabold ${status === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>{message}</p>}
          <button type="button" onClick={submitReservation} disabled={status === 'saving'} className="pill-button mt-6 w-full text-white shadow-[var(--preview-glow)] disabled:opacity-60" style={{ backgroundColor: theme.primary }}>
            {status === 'saving' ? 'Enviando reserva...' : config.conversion?.buttonLabel || 'Solicitar reserva'}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}

function DateSummary({ label, date }) {
  return (
    <div className="rounded-2xl bg-[var(--preview-surface)] p-4">
      <p className="text-xs font-extrabold uppercase text-[var(--preview-primary)]">{label}</p>
      <p className="mt-2 text-sm font-bold text-[var(--preview-text)]">{date ? dateFormatter.format(date) : 'Selecione no calendário'}</p>
    </div>
  );
}

function PeriodInput({ icon, label, value, placeholder, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase text-[var(--preview-muted)]">{icon}{label}</span>
      <input type="text" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-12 w-full rounded-2xl border border-[var(--preview-border)] bg-[var(--preview-surface)] px-4 text-sm font-bold outline-none placeholder:text-[var(--preview-muted)] focus:border-[var(--preview-primary)]" />
    </label>
  );
}

function enumerateDates(start, end) {
  if (!start || !end) return [];
  const dates = [];
  const cursor = startOfDay(start);
  const last = startOfDay(end);
  while (cursor <= last) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

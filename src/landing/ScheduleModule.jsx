import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Mail, MapPin, Phone, Sparkles, UserRound } from 'lucide-react';
import { cardClass } from './theme.js';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js';
import {
  buildCalendarDays,
  dateFormatter,
  formatDateKey,
  generateTimeSlots,
  isBeforeDay,
  isPastTime,
  isSameMonth,
  isTimeBlocked,
  monthFormatter,
  normalizeTime,
  shortWeekdays,
  startOfDay,
} from './dateUtils.js';
import { SectionIntro } from './LandingShared.jsx';

export function ScheduleModule({ config, theme }) {
  const { submission, business, location, availability, availabilityBreaks, availabilityDateBlocks, preset } = config;
  const today = useMemo(() => startOfDay(new Date()), []);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedTime, setSelectedTime] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerWhatsApp, setCustomerWhatsApp] = useState('');
  const [appointmentReason, setAppointmentReason] = useState('');
  const [appointmentStatus, setAppointmentStatus] = useState('idle');
  const [appointmentMessage, setAppointmentMessage] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);

  const selectedRule = useMemo(
    () => availability.find((rule) => Number(rule.weekday) === selectedDate.getDay()),
    [availability, selectedDate],
  );
  const selectedDateBlock = useMemo(
    () => availabilityDateBlocks.find((item) => item.date === formatDateKey(selectedDate)),
    [availabilityDateBlocks, selectedDate],
  );
  const selectedDateKey = formatDateKey(selectedDate);
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);

  const selectedTimes = useMemo(() => {
    if (!selectedRule || selectedDateBlock) return [];
    const allTimes = generateTimeSlots(
      selectedRule.start_time,
      selectedRule.end_time,
      Number(selectedRule.interval_minutes || 30),
    );
    const dayBreaks = availabilityBreaks.filter(
      (breakItem) => Number(breakItem.weekday) === selectedDate.getDay(),
    );
    return allTimes.filter((time) => !isTimeBlocked(time, dayBreaks));
  }, [availabilityBreaks, selectedDate, selectedDateBlock, selectedRule]);

  const bookedTimes = useMemo(
    () =>
      new Set(
        bookedSlots
          .filter((slot) => slot.appointment_date === selectedDateKey)
          .map((slot) => normalizeTime(slot.start_time)),
      ),
    [bookedSlots, selectedDateKey],
  );

  const selectedBreaks = useMemo(
    () => availabilityBreaks.filter((breakItem) => Number(breakItem.weekday) === selectedDate.getDay()),
    [availabilityBreaks, selectedDate],
  );

  const customerWhatsAppDigits = onlyDigits(customerWhatsApp);
  const canRequestAppointment = Boolean(
    selectedRule &&
      !selectedDateBlock &&
      selectedTime &&
      !bookedTimes.has(normalizeTime(selectedTime)) &&
      customerName.trim().length >= 3 &&
      customerWhatsAppDigits.length >= 10,
  );

  useEffect(() => {
    async function loadBookedSlots() {
      if (!isSupabaseConfigured) return;

      const { data, error } = await supabase
        .from('public_appointment_slots')
        .select('submission_slug, appointment_date, start_time')
        .eq('submission_slug', submission.slug);

      if (error) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('appointment_requests')
          .select('submission_slug, appointment_date, start_time')
          .eq('submission_slug', submission.slug)
          .in('status', ['pending', 'confirmed']);

        if (!fallbackError) setBookedSlots(fallbackData || []);
        return;
      }

      setBookedSlots(data || []);
    }

    loadBookedSlots();
  }, [submission.slug]);

  useEffect(() => {
    const nextTime =
      selectedTimes.find(
        (time) => !isPastTime(selectedDate, time) && !bookedTimes.has(normalizeTime(time)),
      ) || '';
    setSelectedTime(nextTime);
  }, [bookedTimes, selectedDate, selectedTimes]);

  function clearFeedback() {
    if (appointmentStatus === 'idle' || appointmentStatus === 'saving') return;
    setAppointmentStatus('idle');
    setAppointmentMessage('');
  }

  async function handleRequestAppointment() {
    if (!canRequestAppointment) {
      setAppointmentStatus('error');
      if (!selectedRule) setAppointmentMessage('Escolha uma data com atendimento disponível.');
      else if (selectedDateBlock) setAppointmentMessage('Esta data está bloqueada para atendimento.');
      else if (!selectedTime) setAppointmentMessage('Escolha um horário disponível.');
      else if (bookedTimes.has(normalizeTime(selectedTime)))
        setAppointmentMessage('Este horário acabou de ser ocupado. Escolha outro horário disponível.');
      else if (customerName.trim().length < 3) setAppointmentMessage('Informe seu nome completo.');
      else if (customerWhatsAppDigits.length < 10)
        setAppointmentMessage('Informe um WhatsApp válido com DDD.');
      else setAppointmentMessage('Revise os dados para solicitar o agendamento.');
      return;
    }

    if (!isSupabaseConfigured) {
      setAppointmentStatus('error');
      setAppointmentMessage('Supabase não configurado. Não foi possível cadastrar o agendamento.');
      return;
    }

    setAppointmentStatus('saving');
    setAppointmentMessage('');

    const { error } = await supabase.from('appointment_requests').insert({
      submission_slug: submission.slug,
      business_name: business.name || submission.business_name,
      customer_name: customerName.trim(),
      customer_whatsapp: customerWhatsAppDigits,
      appointment_date: selectedDateKey,
      start_time: selectedTime,
      status: 'pending',
      source: 'preview_landing',
      payload: {
        reason: appointmentReason.trim() || 'Não informado',
        selected_date_label: dateFormatter.format(selectedDate),
        business_whatsapp: business.whatsapp || submission.whatsapp || '',
      },
    });

    if (error) {
      setAppointmentStatus('error');
      const duplicateSlot = error.code === '23505';
      const missingTable = error.code === '42P01' || error.code === 'PGRST205';
      setAppointmentMessage(
        duplicateSlot
          ? 'Este horário acabou de ser ocupado. Escolha outro horário disponível.'
          : missingTable
            ? 'Tabela de agendamentos ainda não encontrada no cache do Supabase. Rode notify pgrst, reload schema no SQL Editor.'
            : error.message || 'Não foi possível cadastrar o agendamento.',
      );
      return;
    }

    setBookedSlots((current) => [
      ...current,
      { submission_slug: submission.slug, appointment_date: selectedDateKey, start_time: selectedTime },
    ]);
    setAppointmentStatus('success');
    setAppointmentMessage('Agendamento solicitado com sucesso. Em breve enviaremos a confirmação.');
  }

  return (
    <section id="agenda" className="bg-[var(--preview-section)] py-24">
      <div className="section-shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <SectionIntro
            eyebrow={preset.sectionLabels.schedule}
            title="Escolha uma data e horário disponível"
            description="O calendário respeita horários, pausas, bloqueios e agendamentos já cadastrados."
            align="left"
          />
          <div className="mt-8 space-y-4 text-[var(--preview-muted)]">
            <Contact
              icon={<Phone size={19} />}
              text={business.whatsapp || submission.whatsapp || 'WhatsApp não informado'}
            />
            <Contact
              icon={<Mail size={19} />}
              text={business.email || submission.email || 'E-mail não informado'}
            />
            <Contact
              icon={<MapPin size={19} />}
              text={location.address || 'Endereço não informado'}
            />
          </div>
          {location.address && config.enabledModules.location && (
            <LocationMap address={location.address} />
          )}
        </div>

        <div className={cardClass(theme, 'p-5 shadow-[var(--preview-shadow)]')} style={{ borderRadius: theme.radius }}>
          {/* ── Calendário ── */}
          <div className="rounded-3xl border border-[var(--preview-border)] bg-[var(--preview-card)] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  setVisibleMonth(
                    (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
                  )
                }
                disabled={isSameMonth(visibleMonth, today)}
                className="grid h-10 w-10 place-items-center rounded-full bg-[var(--preview-surface)] text-[var(--preview-text)] disabled:opacity-35"
                aria-label="Mês anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <p className="text-center text-sm font-extrabold capitalize">
                {monthFormatter.format(visibleMonth)}
              </p>
              <button
                type="button"
                onClick={() =>
                  setVisibleMonth(
                    (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
                  )
                }
                className="grid h-10 w-10 place-items-center rounded-full bg-[var(--preview-surface)] text-[var(--preview-text)]"
                aria-label="Próximo mês"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {shortWeekdays.map((weekday) => (
                <span
                  key={weekday}
                  className="py-2 text-center text-xs font-extrabold uppercase text-[var(--preview-muted)]"
                >
                  {weekday}
                </span>
              ))}
              {calendarDays.map((day, index) => {
                const past = day && isBeforeDay(day, today);
                const hasRule =
                  day && availability.some((rule) => Number(rule.weekday) === day.getDay());
                const blockedDate =
                  day &&
                  availabilityDateBlocks.some((item) => item.date === formatDateKey(day));
                const disabled = !day || past || !hasRule || blockedDate;
                const selected =
                  day && formatDateKey(day) === selectedDateKey && !disabled;
                return (
                  <button
                    key={day ? day.toISOString() : `empty-${index}`}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      if (!day) return;
                      clearFeedback();
                      setSelectedDate(day);
                    }}
                    className={`aspect-square rounded-2xl text-sm font-extrabold transition duration-300 active:scale-95 ${
                      disabled
                        ? 'cursor-not-allowed text-[var(--preview-muted)] opacity-30'
                        : selected
                          ? 'text-white shadow-[var(--preview-glow)]'
                          : 'bg-[var(--preview-surface)] text-[var(--preview-text)] hover:-translate-y-1 hover:shadow-[var(--preview-shadow)]'
                    }`}
                    style={selected ? { backgroundColor: theme.primary } : undefined}
                  >
                    {day?.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Horários ── */}
          <div className="mt-5 rounded-3xl border border-[var(--preview-border)] bg-[var(--preview-card)] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-extrabold">Horários disponíveis</p>
              <p className="text-xs font-bold text-[var(--preview-muted)]">
                {selectedDateBlock
                  ? 'Data bloqueada'
                  : selectedRule
                    ? `${selectedRule.start_time} às ${selectedRule.end_time}`
                    : 'Sem atendimento'}
              </p>
            </div>

            {selectedDateBlock ? (
              <p className="rounded-2xl bg-[var(--preview-surface)] p-4 text-sm font-bold text-[var(--preview-muted)]">
                {selectedDateBlock.reason || 'Não haverá atendimento nesta data.'}
              </p>
            ) : selectedTimes.length ? (
              <div className="grid max-h-56 grid-cols-3 gap-3 overflow-y-auto pr-1 sm:grid-cols-4">
                {selectedTimes.map((time) => {
                  const booked = bookedTimes.has(normalizeTime(time));
                  const disabled = isPastTime(selectedDate, time) || booked;
                  const selected = selectedTime === time && !disabled;
                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        clearFeedback();
                        setSelectedTime(time);
                      }}
                      className={`rounded-full px-3 py-3 text-sm font-extrabold transition duration-300 active:scale-95 ${
                        disabled
                          ? 'cursor-not-allowed text-[var(--preview-muted)] opacity-30'
                          : selected
                            ? 'text-white shadow-[var(--preview-glow)]'
                            : 'bg-[var(--preview-surface)] text-[var(--preview-text)] hover:-translate-y-1 hover:shadow-[var(--preview-shadow)]'
                      }`}
                      style={selected ? { backgroundColor: theme.primary } : undefined}
                    >
                      {booked ? 'Ocupado' : time}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-2xl bg-[var(--preview-surface)] p-4 text-sm font-bold text-[var(--preview-muted)]">
                Nenhum horário configurado para este dia.
              </p>
            )}

            {selectedBreaks.length > 0 && (
              <div className="mt-4 rounded-2xl bg-[var(--preview-surface)] p-4">
                <p className="text-xs font-extrabold uppercase text-[var(--preview-primary)]">
                  Intervalos bloqueados
                </p>
                {selectedBreaks.map((breakItem, index) => (
                  <p
                    key={`${breakItem.start_time}-${index}`}
                    className="mt-2 text-sm font-bold text-[var(--preview-muted)]"
                  >
                    {breakItem.start_time} às {breakItem.end_time}
                    {breakItem.reason ? ` — ${breakItem.reason}` : ''}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* ── Formulário ── */}
          <div className="mt-5 grid gap-4 rounded-3xl border border-[var(--preview-border)] bg-[var(--preview-card)] p-4 sm:grid-cols-2">
            <ScheduleInput
              icon={<UserRound size={16} />}
              label="Nome"
              value={customerName}
              placeholder="Seu nome completo"
              onChange={(value) => {
                clearFeedback();
                setCustomerName(value);
              }}
            />
            <ScheduleInput
              icon={<Phone size={16} />}
              label="WhatsApp com DDD"
              value={customerWhatsApp}
              placeholder="(11) 99999-9999"
              onChange={(value) => {
                clearFeedback();
                setCustomerWhatsApp(value);
              }}
            />
            <div className="sm:col-span-2">
              <ScheduleInput
                icon={<Sparkles size={16} />}
                label="Motivo do agendamento"
                value={appointmentReason}
                placeholder="Ex: avaliação, retorno, consulta inicial"
                onChange={(value) => {
                  clearFeedback();
                  setAppointmentReason(value);
                }}
              />
            </div>
          </div>

          {appointmentMessage && (
            <p
              className={`mt-4 rounded-2xl p-4 text-sm font-extrabold ${
                appointmentStatus === 'success'
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : 'bg-rose-500/10 text-rose-600'
              }`}
            >
              {appointmentMessage}
            </p>
          )}

          <button
            type="button"
            onClick={handleRequestAppointment}
            disabled={appointmentStatus === 'saving'}
            className={`pill-button mt-6 w-full text-white shadow-[var(--preview-glow)] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none ${canRequestAppointment ? 'hover:-translate-y-1' : 'bg-slate-300 shadow-none'}`}
            style={
              canRequestAppointment && appointmentStatus !== 'saving'
                ? { backgroundColor: theme.primary }
                : undefined
            }
          >
            {appointmentStatus === 'saving'
              ? 'Cadastrando agendamento…'
              : `Solicitar agendamento${selectedTime ? ` às ${selectedTime}` : ''}`}
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function ScheduleInput({ icon, label, value, placeholder, onChange }) {
  return (
    <label className="block">
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

function Contact({ icon, text }) {
  return (
    <div className="flex items-center gap-3 font-bold">
      <span className="text-[var(--preview-primary)]">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function LocationMap({ address }) {
  const encodedAddress = encodeURIComponent(address);
  const mapUrl = `https://www.google.com/maps?q=${encodedAddress}&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;

  return (
    <div className="mt-8 overflow-hidden rounded-[2rem] border border-[var(--preview-border)] bg-[var(--preview-card)] shadow-[var(--preview-shadow)]">
      <div className="h-72 w-full bg-[var(--preview-card)]">
        <iframe
          title={`Mapa de ${address}`}
          src={mapUrl}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 text-[var(--preview-primary)]">
            <MapPin size={20} />
          </span>
          <div>
            <p className="font-extrabold">Localização</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-[var(--preview-muted)]">{address}</p>
          </div>
        </div>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="pill-button shrink-0 text-white shadow-[var(--preview-glow)]"
          style={{ backgroundColor: 'var(--preview-primary)' }}
        >
          Como chegar
          <ArrowRight size={18} />
        </a>
      </div>
    </div>
  );
}

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

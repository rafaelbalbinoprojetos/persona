import { useMemo, useState } from 'react';
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Phone, UserRound } from 'lucide-react';
import SectionHeading from './SectionHeading.jsx';
import { scheduleOptions } from '../data/landingData.js';

const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

export default function OnlineSchedule() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const availableTimes = useMemo(() => generateTimeSlots('08:00', '18:00', 30), []);
  const [selectedTime, setSelectedTime] = useState(() => getDefaultTime(availableTimes, today));

  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const selectedDateLabel = dateFormatter.format(selectedDate);
  const availableCount = availableTimes.filter((time) => !isPastTime(selectedDate, time)).length;
  const canConfirm = patientName.trim().length >= 3 && patientPhone.replace(/\D/g, '').length >= 10 && Boolean(selectedTime);

  function changeMonth(direction) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  }

  function handleDateSelect(day) {
    if (!day || isBeforeDay(day, today)) return;
    setSelectedDate(day);
    setSelectedTime(getDefaultTime(availableTimes, day));
  }

  return (
    <section id="agenda" className="bg-white py-24 sm:py-28">
      <div className="section-shell grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Agenda online"
            title="Um fluxo de agendamento claro, rápido e pronto para integrar com horários reais."
            description="Mostre disponibilidade, organize preferencias e reduza atrito antes da primeira conversa com a recepcao."
          />

          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            {['Escolha o serviço', 'Selecione horário', 'Confirme no WhatsApp'].map((item, index) => (
              <div key={item} className="rounded-3xl border border-slate-100 bg-[#fbfdff] p-5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-sm font-extrabold text-white">{index + 1}</span>
                <p className="mt-4 text-sm font-bold leading-6 text-brand-900">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -right-8 -top-8 hidden h-32 w-32 rounded-full bg-lilac-100/70 blur-2xl sm:block" />
          <div className="relative rounded-[2.25rem] border border-slate-100 bg-[#f8fbff] p-4 shadow-soft sm:p-6">
            <div className="rounded-[1.75rem] bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase text-brand-600">Nova consulta</p>
                  <h3 className="mt-2 text-2xl font-extrabold text-brand-900">Agendar avaliação</h3>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-mint-50 px-4 py-2 text-sm font-bold text-mint-500">
                  <Check size={17} />
                  {availableCount} horários livres
                </span>
              </div>

              <div className="mt-7 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    icon={<UserRound size={20} />}
                    label="Nome do paciente"
                    value={patientName}
                    onChange={(event) => setPatientName(event.target.value)}
                    placeholder="Seu nome completo"
                    autoComplete="name"
                  />
                  <InputField
                    icon={<Phone size={20} />}
                    label="Telefone com DDD"
                    value={patientPhone}
                    onChange={(event) => setPatientPhone(formatPhone(event.target.value))}
                    placeholder="(11) 99999-9999"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </div>

                <Field icon={<CalendarDays size={20} />} label="Serviço" value={scheduleOptions.services[0]} />
                <Field icon={<UserRound size={20} />} label="Profissional" value={scheduleOptions.professionals[0]} />

                <div className="rounded-3xl border border-slate-100 bg-[#fbfdff] p-4">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                      <CalendarDays size={19} className="text-brand-600" />
                      Selecione o dia
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <button
                        type="button"
                        onClick={() => changeMonth(-1)}
                        disabled={isSameMonth(visibleMonth, today)}
                        className="grid h-9 w-9 place-items-center rounded-full bg-white text-brand-900 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:text-slate-300"
                        aria-label="Mes anterior"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <p className="min-w-40 text-center text-sm font-extrabold capitalize text-brand-900">
                        {monthFormatter.format(visibleMonth)}
                      </p>
                      <button
                        type="button"
                        onClick={() => changeMonth(1)}
                        className="grid h-9 w-9 place-items-center rounded-full bg-white text-brand-900 transition hover:bg-brand-50"
                        aria-label="Próximo mês"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {weekdays.map((weekday) => (
                      <span key={weekday} className="py-2 text-center text-xs font-extrabold uppercase text-slate-400">
                        {weekday}
                      </span>
                    ))}
                    {calendarDays.map((day, index) => {
                      const disabled = !day || isBeforeDay(day, today);
                      const selected = day && isSameDay(day, selectedDate);
                      const isToday = day && isSameDay(day, today);

                      return (
                        <button
                          key={day ? day.toISOString() : `empty-${index}`}
                          type="button"
                          disabled={disabled}
                          onClick={() => handleDateSelect(day)}
                          className={`aspect-square rounded-2xl text-sm font-extrabold transition ${
                            selected
                              ? 'bg-brand-600 text-white shadow-glow'
                              : disabled
                                ? 'cursor-not-allowed bg-transparent text-slate-300'
                                : 'bg-white text-brand-900 hover:bg-brand-50 hover:text-brand-700'
                          }`}
                        >
                          {day ? (
                            <span className="flex h-full flex-col items-center justify-center gap-1">
                              {day.getDate()}
                              {isToday && <span className={`h-1.5 w-1.5 rounded-full ${selected ? 'bg-white' : 'bg-brand-500'}`} />}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-100 bg-[#fbfdff] p-4">
                  <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                      <Clock3 size={19} className="text-brand-600" />
                      Horarios de 30 em 30 minutos
                    </div>
                    <p className="text-xs font-bold capitalize text-brand-600">{selectedDateLabel}</p>
                  </div>
                  <div className="grid max-h-64 grid-cols-3 gap-3 overflow-y-auto pr-1 sm:grid-cols-4 lg:grid-cols-5">
                    {availableTimes.map((time) => {
                      const disabled = isPastTime(selectedDate, time);
                      const selected = selectedTime === time;

                      return (
                      <button
                        key={time}
                        type="button"
                        disabled={disabled}
                        onClick={() => setSelectedTime(time)}
                        className={`rounded-full px-3 py-3 text-sm font-extrabold transition ${
                          selected
                            ? 'bg-brand-600 text-white shadow-glow'
                            : disabled
                              ? 'cursor-not-allowed bg-white/50 text-slate-300'
                            : 'bg-white text-brand-900 hover:bg-brand-50 hover:text-brand-700'
                        }`}
                      >
                        {time}
                      </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                disabled={!canConfirm}
                className="pill-button mt-6 w-full bg-brand-600 text-white shadow-glow hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                Confirmar para {selectedDateLabel} as {selectedTime || '--:--'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InputField({ icon, label, value, onChange, placeholder, inputMode, autoComplete }) {
  return (
    <label className="rounded-3xl border border-slate-100 bg-[#fbfdff] p-4">
      <span className="mb-3 flex items-center gap-3 text-xs font-bold uppercase text-slate-400">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-600">{icon}</span>
        {label}
      </span>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        className="w-full rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold text-brand-900 outline-none transition placeholder:text-slate-300 focus:border-brand-200 focus:ring-4 focus:ring-brand-50"
      />
    </label>
  );
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 2) {
    return digits ? `(${digits}` : '';
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function buildCalendarDays(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = Array.from({ length: firstDay.getDay() }, () => null);

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(year, month, day));
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

function generateTimeSlots(start, end, intervalMinutes) {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  const slots = [];

  for (let minutes = startMinutes; minutes <= endMinutes; minutes += intervalMinutes) {
    slots.push(minutesToTime(minutes));
  }

  return slots;
}

function getDefaultTime(times, date) {
  return times.find((time) => !isPastTime(date, time)) || '';
}

function isPastTime(date, time) {
  const now = new Date();
  if (!isSameDay(date, now)) return false;

  const [hours, minutes] = time.split(':').map(Number);
  const slotDate = new Date(date);
  slotDate.setHours(hours, minutes, 0, 0);

  return slotDate <= now;
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function isBeforeDay(date, comparison) {
  return startOfDay(date).getTime() < startOfDay(comparison).getTime();
}

function isSameDay(first, second) {
  return (
    first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate()
  );
}

function isSameMonth(first, second) {
  return first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth();
}

function Field({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-[#fbfdff] p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-600">{icon}</span>
        <div>
          <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
          <p className="mt-1 font-extrabold text-brand-900">{value}</p>
        </div>
      </div>
      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500">Editar</span>
    </div>
  );
}

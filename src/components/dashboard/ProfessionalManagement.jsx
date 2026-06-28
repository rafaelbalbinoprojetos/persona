import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import {
  BarChart3,
  CalendarCheck,
  CheckCheck,
  CheckCircle2,
  Clock3,
  MessageCircle,
  PieChart,
  UserRound,
  XCircle,
} from 'lucide-react';
import { EmptyState } from './DashboardShared.jsx';

export function ProfessionalManagement({
  appointments,
  reservations = [],
  status,
  reservationsStatus = { type: 'idle', message: '' },
  selectedDate,
  onDateChange,
  onRefresh,
  onUpdateStatus,
  onUpdateReservationStatus,
}) {
  const [reservationMonth, setReservationMonth] = useState('all');
  const allRequests = [...appointments, ...reservations];
  const activeAppointments = allRequests.filter((item) => item.status !== 'cancelled');
  const dayAppointments = appointments
    .filter((item) => item.appointment_date === selectedDate)
    .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
  const pending = allRequests.filter((item) => item.status === 'pending').length;
  const confirmed = allRequests.filter((item) => item.status === 'confirmed').length;
  const completed = allRequests.filter((item) => item.status === 'completed').length;
  const noShowRisk = dayAppointments.filter((item) => item.status === 'pending').length;
  const reasonData = buildChartData(appointments, getAppointmentReason);
  const statusData = buildChartData(appointments, (item) => appointmentStatusLabel(item.status));
  const activeReservations = reservations.filter((item) => item.status !== 'cancelled');

  // Layout adaptável: só mostra os blocos relevantes ao tipo de negócio.
  const hasAppointments = appointments.length > 0;
  const hasReservations = reservations.length > 0;
  const showReservations = hasReservations || reservationsStatus.type === 'error';
  const showAgenda = hasAppointments || status.type === 'error';
  const hasAnyData = hasAppointments || hasReservations;

  // Reservas por mês (gráfico + filtro). Agrupa pela data de início.
  const reservationMonthKeys = Array.from(
    new Set(activeReservations.map((item) => String(item.start_date).slice(0, 7))),
  ).filter(Boolean).sort();
  const reservationMonthData = reservationMonthKeys.map((key) => ({
    key,
    value: activeReservations.filter((item) => String(item.start_date).slice(0, 7) === key).length,
  }));
  const visibleReservations = reservationMonth === 'all'
    ? reservations
    : reservations.filter((item) => String(item.start_date).slice(0, 7) === reservationMonth);

  const reservationMonthOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 12, right: 12, top: 24, bottom: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: reservationMonthData.map((item) => item.key),
      axisLabel: { color: '#64748b', fontWeight: 700, formatter: (key) => formatMonthLabel(key) },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: '#64748b', fontWeight: 700 },
      splitLine: { lineStyle: { color: '#eaf1f8' } },
    },
    series: [{
      name: 'Reservas',
      type: 'bar',
      data: reservationMonthData.map((item) => item.value),
      label: { show: true, position: 'top', color: '#0b1f44', fontWeight: 900, formatter: '{c}' },
      itemStyle: { borderRadius: [10, 10, 0, 0], color: '#1c8dff' },
    }],
  };

  const reasonOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { color: '#64748b', fontWeight: 700 } },
    series: [{
      name: 'Motivos',
      type: 'pie',
      radius: ['46%', '72%'],
      center: ['50%', '43%'],
      avoidLabelOverlap: true,
      label: { show: true, formatter: '{b}\n{c} ({d}%)', color: '#0b1f44', fontWeight: 800, lineHeight: 18 },
      labelLine: { show: true, length: 14, length2: 10, lineStyle: { color: '#cbd5e1' } },
      data: reasonData,
    }],
  };

  const statusOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 12, right: 12, top: 42, bottom: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: statusData.map((item) => item.name),
      axisLabel: { color: '#64748b', fontWeight: 700 },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: '#64748b', fontWeight: 700 },
      splitLine: { lineStyle: { color: '#eaf1f8' } },
    },
    series: [{
      name: 'Agendamentos',
      type: 'bar',
      data: statusData.map((item) => item.value),
      label: { show: true, position: 'top', color: '#0b1f44', fontWeight: 900, formatter: '{c}' },
      itemStyle: { borderRadius: [10, 10, 0, 0], color: '#1c8dff' },
    }],
  };

  const insights = [];
  if (showAgenda) {
    insights.push({
      title: 'Risco do dia',
      value: `${noShowRisk} pendente(s)`,
      description: 'Priorize confirmar esses clientes antes do horário.',
    });
  }
  insights.push({
    title: 'Taxa de confirmação',
    value: `${percentage(confirmed, allRequests.length)}%`,
    description: 'Percentual de solicitações já confirmadas.',
  });
  insights.push({
    title: 'Volume total',
    value: allRequests.length,
    description: 'Total de agendamentos e reservas recebidos para esta página.',
  });

  return (
    <div className="grid gap-6">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <ManagementMetric label="Agenda ativa" value={activeAppointments.length} Icon={CalendarCheck} />
        <ManagementMetric label="Pendentes" value={pending} Icon={Clock3} tone="amber" />
        <ManagementMetric label="Confirmados" value={confirmed} Icon={CheckCircle2} tone="green" />
        <ManagementMetric label="Concluídos" value={completed} Icon={UserRound} tone="violet" />
      </div>

      {!hasAnyData && reservationsStatus.type !== 'error' && status.type !== 'error' && (
        <div className="rounded-[2rem] bg-[#fbfdff] p-5">
          <EmptyState text="Nenhuma solicitação recebida ainda. Compartilhe sua página para começar a receber agendamentos e reservas." />
        </div>
      )}

      {showReservations && (
        <div className="rounded-[2rem] bg-[#fbfdff] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold">Reservas por período</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Estadias, locações e eventos com uma ou mais datas selecionadas.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {reservationMonthKeys.length > 0 && (
                <select
                  value={reservationMonth}
                  onChange={(event) => setReservationMonth(event.target.value)}
                  className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none"
                >
                  <option value="all">Todos os meses</option>
                  {reservationMonthKeys.map((key) => (
                    <option key={key} value={key}>{formatMonthLabel(key)}</option>
                  ))}
                </select>
              )}
              <p className="rounded-full bg-brand-50 px-4 py-2 text-sm font-extrabold text-brand-700">
                {activeReservations.length} ativa(s)
              </p>
            </div>
          </div>

          {reservationMonthData.length > 0 && (
            <div className="mt-5 rounded-3xl bg-white p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <BarChart3 size={18} className="text-brand-600" />
                <h3 className="text-base font-extrabold">Reservas por mês</h3>
                <span className="text-xs font-semibold text-slate-400">(clique numa barra para filtrar)</span>
              </div>
              <EChart
                option={reservationMonthOption}
                empty={false}
                height="h-56"
                onClick={(params) => setReservationMonth((current) => (current === params.name ? 'all' : params.name))}
              />
            </div>
          )}

          {reservationsStatus.message && (
            <p className={`mt-4 rounded-2xl p-4 text-sm font-bold ${
              reservationsStatus.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-700'
            }`}>
              {reservationsStatus.message}
            </p>
          )}

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {visibleReservations.length
              ? visibleReservations.map((reservation) => (
                <article key={reservation.id} className="rounded-3xl bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-extrabold uppercase text-brand-600">Período reservado</p>
                      <p className="mt-2 text-lg font-extrabold">
                        {formatDate(reservation.start_date)} até {formatDate(reservation.end_date)}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${statusClass(reservation.status)}`}>
                      {appointmentStatusLabel(reservation.status)}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-extrabold">{reservation.customer_name}</h3>
                  <p className="mt-2 text-sm font-bold text-slate-500">WhatsApp: {formatPhone(reservation.customer_whatsapp)}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    Detalhes: <span className="font-extrabold text-brand-900">{reservation.payload?.details || 'Não informado'}</span>
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <WhatsAppButton href={whatsappHref(reservation.customer_whatsapp, reservationMessage(reservation))} />
                    <button onClick={() => onUpdateReservationStatus(reservation.id, 'confirmed')} disabled={reservation.status === 'confirmed' || reservation.status === 'completed'} className="pill-button bg-emerald-50 px-4 py-2 text-emerald-600 disabled:opacity-35">
                      <CheckCircle2 size={17} /> Confirmar
                    </button>
                    {reservation.status === 'confirmed' && (
                      <button onClick={() => onUpdateReservationStatus(reservation.id, 'completed')} className="pill-button bg-brand-50 px-4 py-2 text-brand-700">
                        <CheckCheck size={17} /> Concluir
                      </button>
                    )}
                    <button onClick={() => onUpdateReservationStatus(reservation.id, 'cancelled')} disabled={reservation.status === 'cancelled'} className="pill-button bg-red-50 px-4 py-2 text-red-500 disabled:opacity-35">
                      <XCircle size={17} /> Cancelar
                    </button>
                  </div>
                </article>
              ))
              : <div className="lg:col-span-2"><EmptyState text={reservations.length ? 'Nenhuma reserva neste mês.' : 'Nenhuma reserva por período recebida.'} /></div>}
          </div>
        </div>
      )}

      {showAgenda && (
        <div className="grid gap-6 2xl:grid-cols-[minmax(720px,1.35fr)_minmax(520px,0.85fr)]">
          <div className="rounded-[2rem] bg-[#fbfdff] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold">Agenda do dia</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Timeline dos clientes, horários e motivos do agendamento.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => onDateChange(event.target.value)}
                  className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-brand-200 focus:ring-4 focus:ring-brand-50"
                />
                <button
                  onClick={onRefresh}
                  className="pill-button bg-brand-50 px-4 py-2 text-brand-700 hover:bg-brand-600 hover:text-white"
                >
                  Atualizar
                </button>
              </div>
            </div>

            {status.message && (
              <p className={`mt-4 rounded-2xl p-4 text-sm font-bold ${
                status.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-700'
              }`}>
                {status.message}
              </p>
            )}

            <div className="mt-6 space-y-4">
              {dayAppointments.length
                ? dayAppointments.map((appointment) => (
                  <article
                    key={appointment.id}
                    className="grid gap-4 rounded-3xl bg-white p-4 shadow-sm sm:grid-cols-[90px_1fr_auto] sm:items-center"
                  >
                    <div className="rounded-2xl bg-brand-50 px-4 py-3 text-center">
                      <p className="text-xl font-extrabold text-brand-700">{normalizeTime(appointment.start_time)}</p>
                      <p className="text-xs font-bold uppercase text-slate-500">{appointmentStatusLabel(appointment.status)}</p>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-extrabold">{appointment.customer_name}</h3>
                        <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${statusClass(appointment.status)}`}>
                          {appointmentStatusLabel(appointment.status)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-bold text-slate-500">WhatsApp: {formatPhone(appointment.customer_whatsapp)}</p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                        Motivo: <span className="font-extrabold text-brand-900">{getAppointmentReason(appointment)}</span>
                      </p>
                    </div>
                    <div className="flex gap-2 sm:flex-col">
                      <a
                        href={whatsappHref(appointment.customer_whatsapp, appointmentMessage(appointment))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500 text-white hover:bg-emerald-600"
                        aria-label="Falar no WhatsApp"
                      >
                        <MessageCircle size={18} />
                      </a>
                      <button
                        onClick={() => onUpdateStatus(appointment.id, 'confirmed')}
                        disabled={appointment.status === 'confirmed' || appointment.status === 'completed'}
                        className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-emerald-600 disabled:opacity-35"
                        aria-label="Confirmar"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                      {appointment.status === 'confirmed' && (
                        <button
                          onClick={() => onUpdateStatus(appointment.id, 'completed')}
                          className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-700"
                          aria-label="Concluir"
                        >
                          <CheckCheck size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => onUpdateStatus(appointment.id, 'cancelled')}
                        disabled={appointment.status === 'cancelled'}
                        className="grid h-10 w-10 place-items-center rounded-full bg-red-50 text-red-500 disabled:opacity-35"
                        aria-label="Cancelar"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  </article>
                ))
                : <EmptyState text="Nenhum agendamento para esta data." />}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-1">
            <div className="rounded-[2rem] bg-[#fbfdff] p-5">
              <div className="mb-4 flex items-center gap-2">
                <PieChart size={20} className="text-brand-600" />
                <h2 className="text-xl font-extrabold">Motivos dos agendamentos</h2>
              </div>
              <EChart option={reasonOption} empty={!reasonData.length} />
            </div>
            <div className="rounded-[2rem] bg-[#fbfdff] p-5">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-brand-600" />
                <h2 className="text-xl font-extrabold">Status da agenda</h2>
              </div>
              <EChart option={statusOption} empty={!statusData.length} />
            </div>
          </div>
        </div>
      )}

      {hasAnyData && (
        <div className="grid gap-5 md:grid-cols-3">
          {insights.map((insight) => (
            <InsightCard key={insight.title} title={insight.title} value={insight.value} description={insight.description} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sub-componentes internos ────────────────────────────────────────────────

function WhatsAppButton({ href, label = 'WhatsApp' }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="pill-button bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600"
    >
      <MessageCircle size={17} /> {label}
    </a>
  );
}

function EChart({ option, empty, onClick, height = 'h-72' }) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current || empty) return undefined;

    const chart = echarts.init(chartRef.current);
    chart.setOption(option);
    if (onClick) chart.on('click', onClick);

    function handleResize() { chart.resize(); }
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [empty, option, onClick]);

  if (empty) {
    return (
      <div className={`grid ${height} place-items-center rounded-3xl bg-white text-sm font-bold text-slate-500`}>
        Sem dados suficientes.
      </div>
    );
  }

  return <div ref={chartRef} className={`${height} w-full`} />;
}

function ManagementMetric({ label, value, Icon, tone = 'blue' }) {
  const tones = {
    blue: 'bg-brand-50 text-brand-700',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-lilac-50 text-lilac-600',
  };

  return (
    <div className="rounded-[2rem] bg-[#fbfdff] p-6">
      <span className={`grid h-12 w-12 place-items-center rounded-2xl ${tones[tone]}`}>
        <Icon size={21} />
      </span>
      <p className="mt-5 text-3xl font-extrabold">{value}</p>
      <p className="mt-2 text-sm font-bold text-slate-500">{label}</p>
    </div>
  );
}

function InsightCard({ title, value, description }) {
  return (
    <div className="rounded-[2rem] bg-[#fbfdff] p-6">
      <p className="text-sm font-extrabold uppercase text-brand-600">{title}</p>
      <p className="mt-3 text-3xl font-extrabold">{value}</p>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">{description}</p>
    </div>
  );
}

// ─── Funções utilitárias ─────────────────────────────────────────────────────

export function normalizeTime(value) {
  return String(value || '').slice(0, 5);
}

export function getAppointmentReason(appointment) {
  return appointment?.payload?.reason || appointment?.payload?.service_name || 'Não informado';
}

export function appointmentStatusLabel(status) {
  const labels = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    cancelled: 'Cancelado',
    completed: 'Concluído',
  };
  return labels[status] || status || 'Pendente';
}

function statusClass(status) {
  const classes = {
    pending: 'bg-amber-50 text-amber-600',
    confirmed: 'bg-emerald-50 text-emerald-600',
    cancelled: 'bg-red-50 text-red-500',
    completed: 'bg-brand-50 text-brand-700',
  };
  return classes[status] || 'bg-slate-100 text-slate-500';
}

// Monta um link wa.me com mensagem pronta. Adiciona o DDI 55 quando ausente.
function whatsappHref(phone, message) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  const withCountry = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}

function reservationMessage(reservation) {
  const name = reservation.customer_name || '';
  const place = reservation.business_name || 'nosso espaço';
  return `Olá ${name}! Aqui é do ${place}. Sobre sua reserva de ${formatDate(reservation.start_date)} a ${formatDate(reservation.end_date)}: `;
}

function appointmentMessage(appointment) {
  const name = appointment.customer_name || '';
  const place = appointment.business_name || 'nosso atendimento';
  return `Olá ${name}! Aqui é do ${place}. Sobre seu agendamento em ${formatDate(appointment.appointment_date)} às ${normalizeTime(appointment.start_time)}: `;
}

function formatPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return value || '';
}

function buildChartData(items, getKey) {
  const counts = items.reduce((acc, item) => {
    const key = getKey(item) || 'Não informado';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function percentage(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T12:00:00`));
}

// 'YYYY-MM' -> 'mês/AA' (ex.: '2026-12' -> 'dez/26')
function formatMonthLabel(key) {
  if (!key) return '';
  const [year, month] = key.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date).replace('.', '');
  return `${label}/${String(year).slice(2)}`;
}

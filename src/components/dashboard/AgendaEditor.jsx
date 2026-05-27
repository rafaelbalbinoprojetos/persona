import { Plus, Trash2 } from 'lucide-react';
import { Input } from './DashboardShared.jsx';
import { ConversionModeSettings } from './ConversionModeSettings.jsx';

const WEEKDAYS = [
  { label: 'Seg', value: 1 },
  { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 },
  { label: 'Qui', value: 4 },
  { label: 'Sex', value: 5 },
  { label: 'Sáb', value: 6 },
  { label: 'Dom', value: 0 },
];

export function AgendaEditor({
  draft,
  toggleScheduleDay,
  updateScheduleRule,
  addBreak,
  updateBreak,
  removeBreak,
  applyBreakToAllActiveDays,
  addDateBlock,
  updateDateBlock,
  removeDateBlock,
  updateConversion,
}) {
  const rules = draft.payload.availability_rules || [];
  const breaks = draft.payload.availability_breaks || [];
  const dateBlocks = draft.payload.availability_date_blocks || [];
  const conversion = draft.payload.conversion || { mode: 'appointment' };
  const mode = conversion.mode || 'appointment';
  const template = rules[0] || { start_time: '08:00', end_time: '18:00', interval_minutes: 30 };

  return (
    <div className="grid gap-6">
      <ConversionModeSettings conversion={conversion} onChange={updateConversion} />

      {mode !== 'appointment' && !(mode === 'consultation' && conversion.showSchedule) && (
        <div className="rounded-[2rem] border border-[var(--preview-border)] bg-[var(--preview-card)] p-5">
          <h2 className="text-xl font-extrabold">Agenda desativada para este modo</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-[var(--preview-muted)]">
            Os dias, horários e bloqueios continuam salvos, mas não aparecem na página pública enquanto este modo estiver ativo.
          </p>
        </div>
      )}

      {(mode === 'appointment' || (mode === 'consultation' && conversion.showSchedule)) && (
        <>
      {/* ── Dias de atendimento ── */}
      <div className="rounded-[2rem] bg-[#fbfdff] p-5">
        <h2 className="text-xl font-extrabold">Dias de atendimento</h2>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
          Escolha os dias em que o cliente atende e configure o horário padrão.
        </p>

        <div className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-7">
          {WEEKDAYS.map((day) => {
            const active = rules.some((rule) => Number(rule.weekday) === day.value);
            return (
              <button
                key={day.value}
                onClick={() => toggleScheduleDay(day.value)}
                className={`rounded-2xl px-4 py-4 text-sm font-extrabold transition ${
                  active
                    ? 'bg-brand-600 text-white shadow-glow'
                    : 'bg-white text-brand-900 hover:bg-brand-50'
                }`}
              >
                {day.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Input
            label="Início"
            type="time"
            value={template.start_time}
            onChange={(value) => updateScheduleRule('start_time', value)}
          />
          <Input
            label="Fim"
            type="time"
            value={template.end_time}
            onChange={(value) => updateScheduleRule('end_time', value)}
          />
          <label className="block rounded-3xl border border-slate-100 bg-white p-4">
            <span className="mb-3 block text-xs font-bold uppercase text-slate-400">Intervalo</span>
            <select
              value={String(template.interval_minutes)}
              onChange={(event) => updateScheduleRule('interval_minutes', event.target.value)}
              className="w-full rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-brand-200 focus:ring-4 focus:ring-brand-50"
            >
              {['15', '30', '45', '60'].map((option) => (
                <option key={option} value={option}>{option} minutos</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* ── Pausas e bloqueios ── */}
      <div className="rounded-[2rem] bg-[#fbfdff] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold">Pausas e bloqueios</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              Almoço, café, reuniões ou períodos indisponíveis.
            </p>
          </div>
          <button
            onClick={addBreak}
            className="pill-button bg-brand-50 px-4 py-2 text-brand-700 hover:bg-brand-600 hover:text-white"
          >
            <Plus size={17} />
            Adicionar pausa
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {breaks.length ? (
            breaks.map((item, index) => (
              <div
                key={`${item.weekday}-${item.start_time}-${index}`}
                className="rounded-3xl bg-white p-4 shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-extrabold text-brand-600">Bloqueio {index + 1}</p>
                  <button
                    onClick={() => removeBreak(index)}
                    className="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-red-500 hover:bg-red-100"
                    aria-label="Remover pausa"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-4">
                  <label className="block rounded-3xl border border-slate-100 bg-[#fbfdff] p-4">
                    <span className="mb-3 block text-xs font-bold uppercase text-slate-400">Dia</span>
                    <select
                      value={String(item.weekday)}
                      onChange={(event) => updateBreak(index, 'weekday', event.target.value)}
                      className="w-full rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-brand-200 focus:ring-4 focus:ring-brand-50"
                    >
                      {WEEKDAYS.map((day) => (
                        <option key={day.value} value={day.value}>{day.label}</option>
                      ))}
                    </select>
                  </label>
                  <Input
                    label="Início"
                    type="time"
                    value={item.start_time}
                    onChange={(value) => updateBreak(index, 'start_time', value)}
                  />
                  <Input
                    label="Fim"
                    type="time"
                    value={item.end_time}
                    onChange={(value) => updateBreak(index, 'end_time', value)}
                  />
                  <Input
                    label="Motivo"
                    value={item.reason || ''}
                    onChange={(value) => updateBreak(index, 'reason', value)}
                  />
                </div>
                <button
                  onClick={() => applyBreakToAllActiveDays(index)}
                  className="pill-button mt-4 bg-brand-50 px-4 py-2 text-brand-700 hover:bg-brand-600 hover:text-white"
                >
                  Aplicar para todos os dias ativos
                </button>
              </div>
            ))
          ) : (
            <p className="rounded-2xl bg-white p-4 text-sm font-bold text-slate-500">
              Nenhuma pausa configurada.
            </p>
          )}
        </div>
      </div>

      {/* ── Feriados e folgas ── */}
      <div className="rounded-[2rem] bg-[#fbfdff] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold">Feriados e folgas</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              Bloqueie datas inteiras em que não haverá atendimento.
            </p>
          </div>
          <button
            onClick={addDateBlock}
            className="pill-button bg-brand-50 px-4 py-2 text-brand-700 hover:bg-brand-600 hover:text-white"
          >
            <Plus size={17} />
            Adicionar data
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {dateBlocks.length ? (
            dateBlocks.map((item, index) => (
              <div
                key={`${item.date}-${index}`}
                className="grid gap-4 rounded-3xl bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_1.5fr_auto] sm:items-end"
              >
                <Input
                  label="Data"
                  type="date"
                  value={item.date || ''}
                  onChange={(value) => updateDateBlock(index, 'date', value)}
                />
                <label className="block rounded-3xl border border-slate-100 bg-[#fbfdff] p-4">
                  <span className="mb-3 block text-xs font-bold uppercase text-slate-400">Tipo</span>
                  <select
                    value={item.type || 'holiday'}
                    onChange={(event) => updateDateBlock(index, 'type', event.target.value)}
                    className="w-full rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-brand-200 focus:ring-4 focus:ring-brand-50"
                  >
                    <option value="holiday">Feriado</option>
                    <option value="day_off">Folga</option>
                    <option value="blocked">Bloqueio</option>
                  </select>
                </label>
                <Input
                  label="Motivo"
                  value={item.reason || ''}
                  onChange={(value) => updateDateBlock(index, 'reason', value)}
                />
                <button
                  onClick={() => removeDateBlock(index)}
                  className="grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-500 hover:bg-red-100"
                  aria-label="Remover data"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))
          ) : (
            <p className="rounded-2xl bg-white p-4 text-sm font-bold text-slate-500">
              Nenhum feriado ou folga configurado.
            </p>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
}

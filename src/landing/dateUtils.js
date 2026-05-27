export const weekdayNames = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
};

export const shortWeekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
export const dateFormatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

export function getNextAvailabilityLabel(availability) {
  if (!availability.length) return 'Em breve';

  const today = new Date();
  const currentWeekday = today.getDay();
  const orderedRules = availability
    .map((rule) => ({
      ...rule,
      distance: (Number(rule.weekday) - currentWeekday + 7) % 7,
    }))
    .sort((first, second) => first.distance - second.distance || timeToMinutes(first.start_time) - timeToMinutes(second.start_time));

  const nextRule = orderedRules[0];
  if (!nextRule) return 'Em breve';
  if (nextRule.distance === 0) return `Hoje as ${String(nextRule.start_time).slice(0, 5)}`;
  if (nextRule.distance === 1) return `Amanhã às ${String(nextRule.start_time).slice(0, 5)}`;
  return `${weekdayNames[nextRule.weekday]} às ${String(nextRule.start_time).slice(0, 5)}`;
}

export function buildCalendarDays(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = Array.from({ length: firstDay.getDay() }, () => null);

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(year, month, day));
  }

  while (days.length % 7 !== 0) days.push(null);
  return days;
}

export function generateTimeSlots(start, end, intervalMinutes) {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  const slots = [];

  for (let minutes = startMinutes; minutes <= endMinutes; minutes += intervalMinutes) {
    slots.push(minutesToTime(minutes));
  }

  return slots;
}

export function timeToMinutes(time) {
  const [hours, minutes] = String(time).split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function isBeforeDay(date, comparison) {
  return startOfDay(date).getTime() < startOfDay(comparison).getTime();
}

export function isSameDay(first, second) {
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();
}

export function isSameMonth(first, second) {
  return first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth();
}

export function isPastTime(date, time) {
  const now = new Date();
  if (!isSameDay(date, now)) return false;

  const [hours, minutes] = time.split(':').map(Number);
  const slotDate = new Date(date);
  slotDate.setHours(hours, minutes, 0, 0);
  return slotDate <= now;
}

export function isTimeBlocked(time, breaks) {
  const timeMinutes = timeToMinutes(time);
  return breaks.some((breakItem) => {
    const start = timeToMinutes(breakItem.start_time);
    const end = timeToMinutes(breakItem.end_time);
    return timeMinutes >= start && timeMinutes < end;
  });
}

export function formatDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function normalizeTime(value) {
  return String(value || '').slice(0, 5);
}

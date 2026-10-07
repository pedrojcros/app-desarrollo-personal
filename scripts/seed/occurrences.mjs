// Qué días toca un hábito según su regla. Reproduce las reglas del motor de
// ocurrencias de la app (src/domain/recurrence.ts) para saber qué días marcar.
import {
  addDays,
  daysBetween,
  getDayOfMonth,
  getIsoWeekday,
  getLastDayOfMonth,
} from './calendar.mjs';

function matchesMonthly(date, rule) {
  const anchorDay = getDayOfMonth(rule.validFrom);
  const lastDay = getLastDayOfMonth(date);
  const occurrenceDay = Math.min(anchorDay, lastDay);
  return getDayOfMonth(date) === occurrenceDay;
}

function matchesRule(date, rule) {
  switch (rule.frequency) {
    case 'daily':
      return true;
    case 'weekdays':
      return rule.weekdays.includes(getIsoWeekday(date));
    case 'every_n_days': {
      const elapsedDays = daysBetween(rule.validFrom, date);
      return elapsedDays % rule.intervalDays === 0;
    }
    case 'monthly':
      return matchesMonthly(date, rule);
    default:
      throw new Error(`Unknown frequency: ${rule.frequency}`);
  }
}

// Las reglas llegan ordenadas por `validFrom`; vale la última que ya empezó.
function findRuleInForce(rules, date) {
  const startedRules = rules.filter((rule) => rule.validFrom <= date);
  return startedRules[startedRules.length - 1];
}

export function listOccurrenceDates(habit, lastDate) {
  const dates = [];
  let date = habit.startDate;
  while (date <= lastDate) {
    const rule = findRuleInForce(habit.rules, date);
    if (matchesRule(date, rule)) {
      dates.push(date);
    }
    date = addDays(date, 1);
  }
  return dates;
}

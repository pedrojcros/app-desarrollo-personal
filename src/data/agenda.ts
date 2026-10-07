import { getCalendarDateInTimeZone } from '../domain/calendar-date';
import type { Habit, HabitMark, Task } from '../domain/entities';
import type {
  CalendarDate,
  HabitRuleVersion,
  IsoWeekday,
} from '../domain/types';
import type { Tables } from './database.types';
import { fail, succeed, type DataResult } from './result';
import { supabase } from './supabase/client';

type HabitRowWithRules = Tables<'habits'> & {
  habit_rules: Tables<'habit_rules'>[];
};
const MARK_PAGE_SIZE = 1000;

function mapArchiveDate(
  instant: string | null,
  timeZone: string,
): CalendarDate | null {
  if (instant === null) {
    return null;
  }
  const archiveInstant = new Date(instant);
  return getCalendarDateInTimeZone(archiveInstant, timeZone);
}

function mapTime(time: string | null): string | null {
  if (time === null) {
    return null;
  }
  return time.slice(0, 5);
}

function mapRuleRow(row: Tables<'habit_rules'>): HabitRuleVersion {
  // Las restricciones de Postgres garantizan días ISO de 1 a 7.
  const weekdays = (row.weekdays ?? []) as IsoWeekday[];
  return {
    validFrom: row.valid_from,
    frequency: row.frequency,
    weekdays,
    intervalDays: row.interval_days,
  };
}

export function mapHabitRow(row: HabitRowWithRules, timeZone: string): Habit {
  const ruleVersions = row.habit_rules.map(mapRuleRow);
  return {
    id: row.id,
    name: row.name,
    categoryId: row.category_id,
    sectionId: row.section_id,
    startDate: row.start_date,
    timeOfDay: mapTime(row.time_of_day),
    timeSlot: row.time_slot,
    durationMinutes: row.duration_minutes,
    ruleVersions,
    archivedOn: mapArchiveDate(row.archived_at, timeZone),
  };
}

function describeReadFailure(isNetworkError: boolean): DataResult<never> {
  if (isNetworkError) {
    return fail('network_error', 'Could not reach the agenda server');
  }
  return fail('unknown_error', 'Could not read agenda data');
}

/** Lee hábitos y todas sus reglas en una consulta; RLS limita las filas al dueño. */
export async function fetchHabits(options: {
  includeArchived: boolean;
  timeZone: string;
}): Promise<DataResult<Habit[]>> {
  try {
    let query = supabase.from('habits').select('*, habit_rules(*)');
    if (!options.includeArchived) {
      query = query.is('archived_at', null);
    }
    const response = await query;
    if (response.error) {
      return describeReadFailure(response.status === 0);
    }
    const habits = response.data.map((row) =>
      mapHabitRow(row, options.timeZone),
    );
    return succeed(habits);
  } catch (error) {
    return describeReadFailure(error instanceof TypeError);
  }
}

function mapHabitMarkRow(row: Tables<'habit_marks'>): HabitMark {
  return {
    habitId: row.habit_id,
    date: row.occurrence_date,
    status: row.status,
    markedAt: row.marked_at,
  };
}

/** Rango inclusivo; pagina para no truncar historiales en el límite REST de filas. */
export async function fetchHabitMarks(range: {
  fromDate: CalendarDate;
  toDate: CalendarDate;
}): Promise<DataResult<HabitMark[]>> {
  try {
    const marks: HabitMark[] = [];
    let offset = 0;
    while (true) {
      const lastRow = offset + MARK_PAGE_SIZE - 1;
      const query = supabase
        .from('habit_marks')
        .select('*')
        .gte('occurrence_date', range.fromDate)
        .lte('occurrence_date', range.toDate);
      const orderedQuery = query.order('habit_id').order('occurrence_date');
      const response = await orderedQuery.range(offset, lastRow);
      if (response.error) {
        return describeReadFailure(response.status === 0);
      }
      const page = response.data.map(mapHabitMarkRow);
      marks.push(...page);
      if (page.length < MARK_PAGE_SIZE) {
        return succeed(marks);
      }
      offset += MARK_PAGE_SIZE;
    }
  } catch (error) {
    return describeReadFailure(error instanceof TypeError);
  }
}

/** Convierte la persistencia de tareas al contrato común de dominio. */
export function mapTaskRow(row: Tables<'tasks'>, timeZone: string): Task {
  return {
    id: row.id,
    name: row.name,
    notes: row.notes,
    categoryId: row.category_id,
    sectionId: row.section_id,
    dueDate: row.due_date,
    dueTime: mapTime(row.due_time),
    status: row.status,
    markedAt: row.marked_at,
    archivedOn: mapArchiveDate(row.archived_at, timeZone),
  };
}

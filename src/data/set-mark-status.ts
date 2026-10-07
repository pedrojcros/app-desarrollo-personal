import { z } from 'zod';

import type { ItemStatus, MarkTarget } from '../domain/items';
import type { CalendarDate } from '../domain/types';
import { fail, succeed, type DataResult } from './result';
import { supabase } from './supabase/client';

const FOREIGN_KEY_VIOLATION = '23503';

const calendarDateSchema = z.iso.date();
const instantSchema = z.iso.datetime();
const markInstantSchema = instantSchema.nullable();
const markRequestSchema = z.object({
  target: z.discriminatedUnion('kind', [
    z.object({
      kind: z.literal('occurrence'),
      habitId: z.uuid(),
      date: calendarDateSchema,
    }),
    z.object({ kind: z.literal('task'), taskId: z.uuid() }),
  ]),
  status: z.enum(['pending', 'done', 'not_done']),
  today: calendarDateSchema,
});

export type MarkOutcome = DataResult<{ markedAt: string | null }>;

function describeFailure(isNetworkError: boolean): MarkOutcome {
  if (isNetworkError) {
    return fail('network_error', 'Could not reach the server to save the mark');
  }
  return fail('unknown_error', 'Could not save the mark');
}

export function isFutureOccurrence(
  target: MarkTarget,
  today: CalendarDate,
): boolean {
  if (target.kind !== 'occurrence') {
    return false;
  }
  // Las fechas YYYY-MM-DD se ordenan igual como texto que como calendario.
  return target.date > today;
}

async function saveOccurrenceMark(
  habitId: string,
  date: CalendarDate,
  status: ItemStatus,
  markedAt: string | null,
): Promise<MarkOutcome> {
  const habits = supabase.from('habits');
  const habitQuery = habits.select('id');
  const habit = await habitQuery.eq('id', habitId);
  if (habit.error) {
    return describeFailure(habit.status === 0);
  }
  if (habit.data.length === 0) {
    return fail('not_found', 'The habit does not exist');
  }
  if (status === 'pending') {
    const deletion = await supabase
      .from('habit_marks')
      .delete()
      .eq('habit_id', habitId)
      .eq('occurrence_date', date);
    if (deletion.error) {
      return describeFailure(deletion.status === 0);
    }
    return succeed({ markedAt: null });
  }

  const row = {
    habit_id: habitId,
    occurrence_date: date,
    status,
    marked_at: markedAt ?? undefined,
  };
  const upsert = await supabase
    .from('habit_marks')
    .upsert(row, { onConflict: 'habit_id,occurrence_date' });
  if (upsert.error) {
    // La clave foránea compuesta falla si el hábito no existe o es de otro.
    if (upsert.error.code === FOREIGN_KEY_VIOLATION) {
      return fail('not_found', 'The habit does not exist');
    }
    return describeFailure(upsert.status === 0);
  }
  return succeed({ markedAt });
}

async function saveTaskMark(
  taskId: string,
  status: ItemStatus,
  markedAt: string | null,
): Promise<MarkOutcome> {
  const update = await supabase
    .from('tasks')
    .update({ status, marked_at: markedAt })
    .eq('id', taskId)
    .select('id');
  if (update.error) {
    return describeFailure(update.status === 0);
  }
  // RLS oculta las tareas ajenas: sin filas afectadas, no es del usuario.
  if (update.data.length === 0) {
    return fail('not_found', 'The task does not exist');
  }
  return succeed({ markedAt });
}

/** Guarda el estado. 'pending' borra la marca (ocurrencia) o deja status = 'pending' y marked_at = null (tarea). */
async function saveMarkStatus(
  target: MarkTarget,
  status: ItemStatus,
  today: CalendarDate,
  markedAt: string | null,
): Promise<MarkOutcome> {
  const parsedRequest = markRequestSchema.safeParse({ target, status, today });
  if (!parsedRequest.success) {
    return fail('invalid_input', 'The mark request has an invalid format');
  }
  // RN-05: lo que todavía no ha llegado no se marca.
  if (isFutureOccurrence(target, today)) {
    return fail('future_date', 'Future occurrences cannot be marked');
  }

  const validInstant = markInstantSchema.safeParse(markedAt);
  const validPendingInstant =
    status === 'pending' ? markedAt === null : markedAt !== null;
  if (!validInstant.success || !validPendingInstant) {
    return fail('invalid_input', 'The mark instant has an invalid format');
  }
  try {
    if (target.kind === 'occurrence') {
      return await saveOccurrenceMark(
        target.habitId,
        target.date,
        status,
        markedAt,
      );
    }
    return await saveTaskMark(target.taskId, status, markedAt);
  } catch (error) {
    return describeFailure(error instanceof TypeError);
  }
}

/** Guarda una marca nueva con el instante actual. */
export function setMarkStatus(
  target: MarkTarget,
  status: ItemStatus,
  today: CalendarDate,
): Promise<MarkOutcome> {
  const instant = new Date();
  const markedAt = status === 'pending' ? null : instant.toISOString();
  return saveMarkStatus(target, status, today, markedAt);
}

// Solo lo usa Deshacer: conserva el instante anterior sin ampliar el contrato de marks.ts.
export function restoreMarkStatus(
  target: MarkTarget,
  status: ItemStatus,
  today: CalendarDate,
  markedAt: string | null,
): Promise<MarkOutcome> {
  return saveMarkStatus(target, status, today, markedAt);
}

import type { PostgrestError } from '@supabase/supabase-js';
import { z } from 'zod';

import type { ContentCounts } from '../domain/category-messages';
import { fail, succeed, type DataResult } from './result';
import { supabase } from './supabase/client';

export type { ContentCounts };

const MAXIMUM_NAME_LENGTH = 60;

/** Nombre de categoría o sección: recortado, de 1 a 60 caracteres. */
export const nameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(
    MAXIMUM_NAME_LENGTH,
    `Name must have at most ${MAXIMUM_NAME_LENGTH} characters`,
  );

const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';
const NO_DATA_FOUND = 'P0002';

export function describeInvalidInput(error: z.ZodError): DataResult<never> {
  const firstIssue = error.issues[0];
  return fail('invalid_input', firstIssue.message);
}

/** Traduce un fallo de PostgREST a los códigos de src/data. */
export function describePostgrestFailure(
  error: PostgrestError,
  status: number,
): DataResult<never> {
  if (status === 0) {
    return fail('network_error', 'Could not reach the server');
  }
  if (error.code === UNIQUE_VIOLATION) {
    return fail('duplicate_name', 'That name is already in use');
  }
  if (error.code === FOREIGN_KEY_VIOLATION || error.code === NO_DATA_FOUND) {
    return fail('not_found', 'The category or section does not exist');
  }
  return fail('unknown_error', 'The operation could not be completed');
}

/** Un `fetch` sin red lanza TypeError; cualquier otra excepción es inesperada. */
export function describeThrownFailure(error: unknown): DataResult<never> {
  if (error instanceof TypeError) {
    return fail('network_error', 'Could not reach the server');
  }
  return fail('unknown_error', 'The operation could not be completed');
}

async function countActiveRows(
  table: 'habits' | 'tasks',
  column: 'category_id' | 'section_id',
  containerId: string,
): Promise<DataResult<number>> {
  const query = supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq(column, containerId)
    .is('archived_at', null);
  const response = await query;
  if (response.error) {
    return describePostgrestFailure(response.error, response.status);
  }
  return succeed(response.count ?? 0);
}

/** Hábitos y tareas no archivados de una categoría o de una sección. */
export async function countContents(
  column: 'category_id' | 'section_id',
  containerId: string,
): Promise<DataResult<ContentCounts>> {
  try {
    const habitsResult = await countActiveRows('habits', column, containerId);
    if (!habitsResult.ok) {
      return habitsResult;
    }
    const tasksResult = await countActiveRows('tasks', column, containerId);
    if (!tasksResult.ok) {
      return tasksResult;
    }
    return succeed({ habits: habitsResult.value, tasks: tasksResult.value });
  } catch (error) {
    return describeThrownFailure(error);
  }
}

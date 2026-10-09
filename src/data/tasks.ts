import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { z } from 'zod';

import { getCalendarDateInTimeZone } from '../domain/calendar-date';
import type { Task } from '../domain/entities';
import type { CalendarDate } from '../domain/types';

import { mapTaskRow } from './agenda';
import {
  describeInvalidInput,
  describePostgrestFailure,
  describeThrownFailure,
} from './category-shared';
import { queryKeys } from './query-keys';
import {
  fail,
  succeed,
  unwrapResult,
  type DataResult,
  type DataResultError,
} from './result';
import { supabase } from './supabase/client';
import { getDeviceTimeZone } from './time-zone';

export interface TaskInput {
  name: string;
  notes: string | null;
  dueDate: CalendarDate | null;
  /** 'HH:MM', solo con `dueDate`. */
  dueTime: string | null;
  categoryId: string | null;
  sectionId: string | null;
}

const MAXIMUM_NAME_LENGTH = 120;

const taskInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .max(
        MAXIMUM_NAME_LENGTH,
        `Name must have at most ${MAXIMUM_NAME_LENGTH} characters`,
      ),
    notes: z.string().nullable(),
    dueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD')
      .nullable(),
    dueTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Due time must be HH:MM')
      .nullable(),
    categoryId: z.uuid().nullable(),
    sectionId: z.uuid().nullable(),
  })
  .refine((input) => input.dueTime === null || input.dueDate !== null, {
    message: 'A due time requires a due date',
  })
  .refine((input) => input.sectionId === null || input.categoryId !== null, {
    message: 'A section requires a category',
  });

type ValidTaskInput = z.infer<typeof taskInputSchema>;

/** Las notas en blanco se guardan como «sin notas». */
function toTaskRow(input: ValidTaskInput) {
  const trimmedNotes = input.notes?.trim() ?? '';
  const notes = trimmedNotes === '' ? null : trimmedNotes;
  return {
    name: input.name,
    notes,
    due_date: input.dueDate,
    due_time: input.dueTime,
    category_id: input.categoryId,
    section_id: input.sectionId,
  };
}

const taskKeys = {
  task: (taskId: string) => ['tasks', taskId] as const,
};

export async function createTask(
  input: TaskInput,
): Promise<DataResult<{ id: string }>> {
  const parsedInput = taskInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return describeInvalidInput(parsedInput.error);
  }
  try {
    const response = await supabase
      .from('tasks')
      .insert(toTaskRow(parsedInput.data))
      .select('id')
      .single();
    if (response.error) {
      return describePostgrestFailure(response.error, response.status);
    }
    return succeed({ id: response.data.id });
  } catch (error) {
    return describeThrownFailure(error);
  }
}

/** Una tarea archivada cuenta como inexistente: ya no se puede abrir ni modificar. */
export async function fetchTask(
  taskId: string,
  timeZone: string,
): Promise<DataResult<Task>> {
  const parsedId = z.uuid().safeParse(taskId);
  if (!parsedId.success) {
    return fail('not_found', 'The task does not exist');
  }
  try {
    const response = await supabase
      .from('tasks')
      .select('*')
      .eq('id', parsedId.data)
      .is('archived_at', null)
      .maybeSingle();
    if (response.error) {
      return describePostgrestFailure(response.error, response.status);
    }
    if (response.data === null) {
      return fail('not_found', 'The task does not exist');
    }
    return succeed(mapTaskRow(response.data, timeZone));
  } catch (error) {
    return describeThrownFailure(error);
  }
}

export async function updateTask(
  taskId: string,
  input: TaskInput,
): Promise<DataResult<null>> {
  const parsedId = z.uuid().safeParse(taskId);
  if (!parsedId.success) {
    return describeInvalidInput(parsedId.error);
  }
  const parsedInput = taskInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return describeInvalidInput(parsedInput.error);
  }
  try {
    const response = await supabase
      .from('tasks')
      .update(toTaskRow(parsedInput.data))
      .eq('id', parsedId.data)
      .is('archived_at', null)
      .select('id');
    if (response.error) {
      return describePostgrestFailure(response.error, response.status);
    }
    if (response.data.length === 0) {
      return fail('not_found', 'The task does not exist');
    }
    return succeed(null);
  } catch (error) {
    return describeThrownFailure(error);
  }
}

const rescheduleInputSchema = z.object({
  taskId: z.uuid(),
  newDueDate: z.iso.date(),
  today: z.iso.date(),
});

/** Cambia solo la fecha: la hora y todo lo demás de la tarea se quedan como estaban. */
export async function rescheduleTask(
  taskId: string,
  newDueDate: CalendarDate,
  today: CalendarDate,
): Promise<DataResult<null>> {
  const parsedInput = rescheduleInputSchema.safeParse({
    taskId,
    newDueDate,
    today,
  });
  if (!parsedInput.success) {
    return describeInvalidInput(parsedInput.error);
  }
  // Las fechas YYYY-MM-DD se ordenan igual como texto que como calendario.
  if (parsedInput.data.newDueDate < parsedInput.data.today) {
    return fail('past_date', 'The new due date must be today or later');
  }
  try {
    const response = await supabase
      .from('tasks')
      .update({ due_date: parsedInput.data.newDueDate })
      .eq('id', parsedInput.data.taskId)
      .is('archived_at', null)
      .select('id');
    if (response.error) {
      return describePostgrestFailure(response.error, response.status);
    }
    if (response.data.length === 0) {
      return fail('not_found', 'The task does not exist');
    }
    return succeed(null);
  } catch (error) {
    return describeThrownFailure(error);
  }
}

/** Archivar conserva el historial (RN-18): no hay borrado definitivo. */
export async function archiveTask(taskId: string): Promise<DataResult<null>> {
  const parsedId = z.uuid().safeParse(taskId);
  if (!parsedId.success) {
    return describeInvalidInput(parsedId.error);
  }
  try {
    const response = await supabase
      .from('tasks')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', parsedId.data)
      .is('archived_at', null)
      .select('id');
    if (response.error) {
      return describePostgrestFailure(response.error, response.status);
    }
    if (response.data.length === 0) {
      return fail('not_found', 'The task does not exist');
    }
    return succeed(null);
  } catch (error) {
    return describeThrownFailure(error);
  }
}

export function useCreateTask(): UseMutationResult<
  { id: string },
  DataResultError,
  TaskInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TaskInput) =>
      unwrapResult(await createTask(input)),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.views() }),
  });
}

export function useTask(taskId: string): UseQueryResult<Task, DataResultError> {
  return useQuery({
    queryKey: taskKeys.task(taskId),
    queryFn: async () =>
      unwrapResult(await fetchTask(taskId, getDeviceTimeZone())),
  });
}

type UpdateTaskVariables = { taskId: string; input: TaskInput };

export function useUpdateTask(): UseMutationResult<
  null,
  DataResultError,
  UpdateTaskVariables
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, input }: UpdateTaskVariables) =>
      unwrapResult(await updateTask(taskId, input)),
    onSuccess: (_value, variables) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.views() }),
        queryClient.invalidateQueries({
          queryKey: taskKeys.task(variables.taskId),
        }),
      ]),
  });
}

export function useArchiveTask(): UseMutationResult<
  null,
  DataResultError,
  string
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) =>
      unwrapResult(await archiveTask(taskId)),
    onSuccess: (_value, taskId) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.views() }),
        queryClient.removeQueries({ queryKey: taskKeys.task(taskId) }),
      ]),
  });
}

type RescheduleTaskVariables = { taskId: string; newDueDate: CalendarDate };

export function useRescheduleTask(): UseMutationResult<
  null,
  DataResultError,
  RescheduleTaskVariables
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, newDueDate }: RescheduleTaskVariables) => {
      // «Hoy» se calcula al guardar, no al pintar: la pantalla puede llevar abierta desde ayer.
      const today = getCalendarDateInTimeZone(new Date(), getDeviceTimeZone());
      return unwrapResult(await rescheduleTask(taskId, newDueDate, today));
    },
    onSuccess: (_value, variables) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.views() }),
        queryClient.invalidateQueries({
          queryKey: taskKeys.task(variables.taskId),
        }),
      ]),
  });
}

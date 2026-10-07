import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { z } from 'zod';

import {
  getCalendarDateInTimeZone,
  parseCalendarDate,
} from '../domain/calendar-date';
import type { Habit } from '../domain/entities';
import type {
  CalendarDate,
  Frequency,
  IsoWeekday,
  TimeSlot,
} from '../domain/types';
import type { Tables, TablesUpdate } from './database.types';
import { queryKeys } from './query-keys';
import {
  DataResultError,
  fail,
  succeed,
  unwrapResult,
  type DataResult,
} from './result';
import { supabase } from './supabase/client';
import { getDeviceTimeZone } from './time-zone';

export interface HabitInput {
  name: string;
  categoryId: string | null;
  sectionId: string | null;
  startDate: CalendarDate;
  timeOfDay: string | null;
  timeSlot: TimeSlot | null;
  frequency: Frequency;
  weekdays: IsoWeekday[];
  intervalDays: number | null;
}

export type HabitChanges = Omit<
  HabitInput,
  'startDate' | 'frequency' | 'weekdays' | 'intervalDays'
>;
export type HabitRuleInput = Pick<
  HabitInput,
  'frequency' | 'weekdays' | 'intervalDays'
>;

const calendarDateSchema = z.string().refine((value) => {
  try {
    parseCalendarDate(value);
    return true;
  } catch {
    return false;
  }
}, 'Invalid calendar date');
const habitFieldsSchema = z.object({
  name: z.string().trim().min(1).max(80),
  categoryId: z.uuid().nullable(),
  sectionId: z.uuid().nullable(),
  timeOfDay: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .nullable(),
  timeSlot: z.enum(['morning', 'afternoon', 'night']).nullable(),
});
const ruleFieldsSchema = z.object({
  frequency: z.enum(['daily', 'weekdays', 'every_n_days', 'monthly']),
  weekdays: z.array(
    z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
      z.literal(6),
      z.literal(7),
    ]),
  ),
  intervalDays: z.number().int().min(1).max(365).nullable(),
});

function validatePlaceAndTime(
  input: HabitChanges,
  context: z.RefinementCtx,
): void {
  if (input.sectionId !== null && input.categoryId === null) {
    context.addIssue({
      code: 'custom',
      path: ['categoryId'],
      message: 'A section requires a category',
    });
  }
  if (input.timeOfDay !== null && input.timeSlot !== null) {
    context.addIssue({
      code: 'custom',
      path: ['timeOfDay'],
      message: 'Choose a time or a slot',
    });
  }
}

function validateRule(input: HabitRuleInput, context: z.RefinementCtx): void {
  if (input.frequency === 'weekdays' && input.weekdays.length === 0) {
    context.addIssue({
      code: 'custom',
      path: ['weekdays'],
      message: 'Select at least one weekday',
    });
  }
  if (input.frequency === 'every_n_days' && input.intervalDays === null) {
    context.addIssue({
      code: 'custom',
      path: ['intervalDays'],
      message: 'Interval days are required',
    });
  }
}

export const habitInputSchema = habitFieldsSchema
  .extend({
    startDate: calendarDateSchema,
    ...ruleFieldsSchema.shape,
  })
  .superRefine((input, context) => {
    validatePlaceAndTime(input, context);
    validateRule(input, context);
  });
const changesSchema = habitFieldsSchema.superRefine(validatePlaceAndTime);
const ruleSchema = ruleFieldsSchema.superRefine(validateRule);

function invalidInput(): DataResult<never> {
  return fail('invalid_input', 'Invalid habit input');
}

function describeFailure(
  error: { code?: string } | null,
  status: number,
): DataResult<never> {
  if (status === 0) {
    return fail('network_error', 'Could not reach the habit server');
  }
  if (error?.code === 'P0002' || error?.code === 'PGRST116') {
    return fail('not_found', 'Habit not found');
  }
  if (error?.code === 'P1001') {
    return fail('already_started', 'Habit has already started');
  }
  const invalidCodes = ['P1002', '23514', '23503', '22P02', '22007'];
  if (error?.code && invalidCodes.includes(error.code)) {
    return invalidInput();
  }
  return fail('unknown_error', 'Could not save habit data');
}

function describeThrownFailure(error: unknown): DataResult<never> {
  if (error instanceof TypeError) {
    return fail('network_error', 'Could not reach the habit server');
  }
  return fail('unknown_error', 'Could not process habit data');
}

export async function createHabit(
  input: HabitInput,
): Promise<DataResult<{ id: string }>> {
  const parsed = habitInputSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput();
  }
  const value = parsed.data;
  try {
    const response = await supabase.rpc('create_habit', {
      p_name: value.name,
      p_start_date: value.startDate,
      p_frequency: value.frequency,
      p_category_id: value.categoryId ?? undefined,
      p_section_id: value.sectionId ?? undefined,
      p_time_of_day: value.timeOfDay ?? undefined,
      p_time_slot: value.timeSlot ?? undefined,
      p_weekdays: value.weekdays,
      p_interval_days: value.intervalDays ?? undefined,
    });
    if (response.error) {
      return describeFailure(response.error, response.status);
    }
    return succeed({ id: response.data });
  } catch (error) {
    return describeThrownFailure(error);
  }
}

type HabitRow = Tables<'habits'> & { habit_rules: Tables<'habit_rules'>[] };

function mapHabit(row: HabitRow, timeZone: string): Habit {
  let archivedOn: CalendarDate | null = null;
  if (row.archived_at !== null) {
    archivedOn = getCalendarDateInTimeZone(new Date(row.archived_at), timeZone);
  }
  const ruleVersions = row.habit_rules.map((rule) => ({
    validFrom: rule.valid_from,
    frequency: rule.frequency,
    weekdays: (rule.weekdays ?? []) as IsoWeekday[],
    intervalDays: rule.interval_days,
  }));
  ruleVersions.sort((first, second) =>
    first.validFrom.localeCompare(second.validFrom),
  );
  return {
    id: row.id,
    name: row.name,
    categoryId: row.category_id,
    sectionId: row.section_id,
    startDate: row.start_date,
    timeOfDay: row.time_of_day?.slice(0, 5) ?? null,
    timeSlot: row.time_slot,
    durationMinutes: row.duration_minutes,
    ruleVersions,
    archivedOn,
  };
}

export async function fetchHabit(
  habitId: string,
  timeZone: string,
): Promise<DataResult<Habit>> {
  if (!z.uuid().safeParse(habitId).success) {
    return invalidInput();
  }
  try {
    const response = await supabase
      .from('habits')
      .select('*, habit_rules(*)')
      .eq('id', habitId)
      .maybeSingle();
    if (response.error) {
      return describeFailure(response.error, response.status);
    }
    if (!response.data) {
      return fail('not_found', 'Habit not found');
    }
    return succeed(mapHabit(response.data, timeZone));
  } catch (error) {
    return describeThrownFailure(error);
  }
}

async function writeHabitFields(
  habitId: string,
  fields: TablesUpdate<'habits'>,
): Promise<DataResult<null>> {
  try {
    const response = await supabase
      .from('habits')
      .update(fields)
      .eq('id', habitId)
      .select('id')
      .maybeSingle();
    if (response.error) {
      return describeFailure(response.error, response.status);
    }
    if (!response.data) {
      return fail('not_found', 'Habit not found');
    }
    return succeed(null);
  } catch (error) {
    return describeThrownFailure(error);
  }
}

export async function updateHabit(
  habitId: string,
  changes: HabitChanges,
): Promise<DataResult<null>> {
  const parsed = changesSchema.safeParse(changes);
  if (!z.uuid().safeParse(habitId).success || !parsed.success) {
    return invalidInput();
  }
  return writeHabitFields(habitId, {
    name: parsed.data.name,
    category_id: parsed.data.categoryId,
    section_id: parsed.data.sectionId,
    time_of_day: parsed.data.timeOfDay,
    time_slot: parsed.data.timeSlot,
  });
}

export async function changeHabitRule(
  habitId: string,
  rule: HabitRuleInput,
  today: CalendarDate,
): Promise<DataResult<null>> {
  const parsed = ruleSchema.safeParse(rule);
  if (
    !z.uuid().safeParse(habitId).success ||
    !calendarDateSchema.safeParse(today).success ||
    !parsed.success
  ) {
    return invalidInput();
  }
  try {
    const habit = await supabase
      .from('habits')
      .select('start_date')
      .eq('id', habitId)
      .maybeSingle();
    if (habit.error) {
      return describeFailure(habit.error, habit.status);
    }
    if (!habit.data) {
      return fail('not_found', 'Habit not found');
    }
    const validFrom =
      today > habit.data.start_date ? today : habit.data.start_date;
    const response = await supabase.rpc('set_habit_rule', {
      p_habit_id: habitId,
      p_valid_from: validFrom,
      p_frequency: parsed.data.frequency,
      p_weekdays: parsed.data.weekdays,
      p_interval_days: parsed.data.intervalDays ?? undefined,
    });
    if (response.error) {
      return describeFailure(response.error, response.status);
    }
    return succeed(null);
  } catch (error) {
    return describeThrownFailure(error);
  }
}

export async function moveHabitStartDate(
  habitId: string,
  newStartDate: CalendarDate,
  today: CalendarDate,
): Promise<DataResult<null>> {
  const input = z
    .object({
      habitId: z.uuid(),
      newStartDate: calendarDateSchema,
      today: calendarDateSchema,
    })
    .safeParse({ habitId, newStartDate, today });
  if (!input.success || newStartDate < today) {
    return invalidInput();
  }
  try {
    const response = await supabase.rpc('move_habit_start_date', {
      p_habit_id: habitId,
      p_new_start_date: newStartDate,
      p_today: today,
    });
    if (response.error) {
      return describeFailure(response.error, response.status);
    }
    return succeed(null);
  } catch (error) {
    return describeThrownFailure(error);
  }
}

export async function archiveHabit(habitId: string): Promise<DataResult<null>> {
  const input = z
    .object({ habitId: z.uuid(), archivedAt: z.iso.datetime() })
    .safeParse({ habitId, archivedAt: new Date().toISOString() });
  if (!input.success) {
    return invalidInput();
  }
  return writeHabitFields(input.data.habitId, {
    archived_at: input.data.archivedAt,
  });
}

function useHabitMutation<Variables, Value>(
  operation: (variables: Variables) => Promise<DataResult<Value>>,
): UseMutationResult<Value, DataResultError, Variables> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: Variables) =>
      unwrapResult(await operation(variables)),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.views() }),
        queryClient.invalidateQueries({ queryKey: ['habits'] }),
      ]);
    },
  });
}

export function useCreateHabit() {
  return useHabitMutation(createHabit);
}

export function useHabit(
  habitId: string,
): UseQueryResult<Habit, DataResultError> {
  const timeZone = getDeviceTimeZone();
  return useQuery({
    queryKey: ['habits', habitId, timeZone],
    queryFn: async () => unwrapResult(await fetchHabit(habitId, timeZone)),
    enabled: habitId.length > 0,
  });
}

interface HabitEditInput {
  habitId: string;
  changes: HabitChanges;
  schedule?: {
    startDate: CalendarDate;
    today: CalendarDate;
    rule: HabitRuleInput;
  };
}

async function saveHabitEdit(input: HabitEditInput): Promise<DataResult<null>> {
  if (!input.schedule) {
    return updateHabit(input.habitId, input.changes);
  }
  const value = {
    ...input.changes,
    ...input.schedule.rule,
    startDate: input.schedule.startDate,
  };
  const parsed = habitInputSchema.safeParse(value);
  const validToday = calendarDateSchema.safeParse(input.schedule.today);
  if (
    !parsed.success ||
    !validToday.success ||
    !z.uuid().safeParse(input.habitId).success
  ) {
    return invalidInput();
  }
  try {
    const response = await supabase.rpc('update_habit', {
      p_habit_id: input.habitId,
      p_name: parsed.data.name,
      p_category_id: parsed.data.categoryId ?? undefined,
      p_section_id: parsed.data.sectionId ?? undefined,
      p_time_of_day: parsed.data.timeOfDay ?? undefined,
      p_time_slot: parsed.data.timeSlot ?? undefined,
      p_new_start_date: parsed.data.startDate,
      p_frequency: parsed.data.frequency,
      p_weekdays: parsed.data.weekdays,
      p_interval_days: parsed.data.intervalDays ?? undefined,
      p_today: validToday.data,
    });
    if (response.error) {
      return describeFailure(response.error, response.status);
    }
    return succeed(null);
  } catch (error) {
    return describeThrownFailure(error);
  }
}

export function useUpdateHabit() {
  return useHabitMutation(saveHabitEdit);
}
export function useChangeHabitRule() {
  return useHabitMutation(
    (input: { habitId: string; rule: HabitRuleInput; today: CalendarDate }) =>
      changeHabitRule(input.habitId, input.rule, input.today),
  );
}
export function useMoveHabitStartDate() {
  return useHabitMutation(
    (input: {
      habitId: string;
      newStartDate: CalendarDate;
      today: CalendarDate;
    }) => moveHabitStartDate(input.habitId, input.newStartDate, input.today),
  );
}
export function useArchiveHabit() {
  return useHabitMutation(archiveHabit);
}

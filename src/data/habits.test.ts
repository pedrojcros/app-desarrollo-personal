import { beforeEach, expect, it, jest } from '@jest/globals';
import {
  createHabit,
  changeHabitRule,
  moveHabitStartDate,
  updateHabit,
  archiveHabit,
  fetchHabit,
  type HabitInput,
} from './habits';
import { supabase } from './supabase/client';

jest.mock('./supabase/client', () => ({
  supabase: { rpc: jest.fn(), from: jest.fn() },
}));
const habitId = '11111111-1111-4111-8111-111111111111';
const input: HabitInput = {
  name: '  Dientes  ',
  categoryId: null,
  sectionId: null,
  startDate: '2026-10-07',
  timeOfDay: null,
  timeSlot: 'night',
  frequency: 'daily',
  weekdays: [],
  intervalDays: null,
};
const mockRpc = jest.mocked(supabase.rpc);
const mockFrom = jest.mocked(supabase.from);

beforeEach(() => {
  jest.resetAllMocks();
});

it('creates the habit atomically through the RPC and trims the name', async () => {
  mockRpc.mockResolvedValue({
    data: habitId,
    error: null,
    status: 200,
  } as never);
  expect(await createHabit(input)).toEqual({
    ok: true,
    value: { id: habitId },
  });
  expect(mockRpc).toHaveBeenCalledWith(
    'create_habit',
    expect.objectContaining({
      p_name: 'Dientes',
      p_start_date: input.startDate,
      p_time_slot: 'night',
    }),
  );
});

it.each([
  { name: '' },
  { name: ' '.repeat(10) },
  { name: 'a'.repeat(81) },
  { frequency: 'weekdays', weekdays: [] },
  { frequency: 'every_n_days', intervalDays: 0 },
  { frequency: 'every_n_days', intervalDays: 366 },
  { frequency: 'every_n_days', intervalDays: 1.5 },
  { timeOfDay: '08:00', timeSlot: 'night' },
  { timeOfDay: '25:00', timeSlot: null },
  { startDate: '2026-02-30' },
  { sectionId: habitId, categoryId: null },
])('rejects invalid input before writing: %j', async (changes) => {
  const result = await createHabit({ ...input, ...changes } as HabitInput);
  expect(result).toMatchObject({ ok: false, error: { code: 'invalid_input' } });
  expect(mockRpc).not.toHaveBeenCalled();
});

it('keeps a future first rule at the future start date', async () => {
  const single = jest.fn<() => Promise<unknown>>().mockResolvedValue({
    data: { start_date: '2026-11-01' },
    error: null,
    status: 200,
  });
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: single,
  };
  mockFrom.mockReturnValue(query as never);
  mockRpc.mockResolvedValue({ data: null, error: null, status: 200 } as never);
  const result = await changeHabitRule(
    habitId,
    { frequency: 'weekdays', weekdays: [3], intervalDays: null },
    '2026-10-07',
  );
  expect(result.ok).toBe(true);
  expect(mockRpc).toHaveBeenCalledWith(
    'set_habit_rule',
    expect.objectContaining({ p_valid_from: '2026-11-01' }),
  );
});

it('maps already_started and passes the device date for moving', async () => {
  mockRpc.mockResolvedValue({
    data: null,
    error: { code: 'P1001' },
    status: 400,
  } as never);
  const result = await moveHabitStartDate(habitId, '2026-10-10', '2026-10-07');
  expect(result).toMatchObject({
    ok: false,
    error: { code: 'already_started' },
  });
  expect(mockRpc).toHaveBeenCalledWith('move_habit_start_date', {
    p_habit_id: habitId,
    p_new_start_date: '2026-10-10',
    p_today: '2026-10-07',
  });
});

it('returns network_error on transport failure', async () => {
  mockRpc.mockRejectedValue(new TypeError('Failed to fetch'));
  expect(await createHabit(input)).toMatchObject({
    ok: false,
    error: { code: 'network_error' },
  });
});

it('validates every mutation before writing', async () => {
  expect(await updateHabit(habitId, { ...input, name: '' })).toMatchObject({
    ok: false,
  });
  expect(await archiveHabit('invalid')).toMatchObject({ ok: false });
  expect(
    await moveHabitStartDate(habitId, '2026-10-06', '2026-10-07'),
  ).toMatchObject({ ok: false });
  expect(
    await changeHabitRule(
      habitId,
      { frequency: 'weekdays', weekdays: [], intervalDays: null },
      '2026-10-07',
    ),
  ).toMatchObject({ ok: false });
  expect(mockFrom).not.toHaveBeenCalled();
  expect(mockRpc).not.toHaveBeenCalled();
});

it('returns not_found when an update or read has no visible row', async () => {
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    maybeSingle: jest
      .fn<() => Promise<unknown>>()
      .mockResolvedValue({ data: null, error: null, status: 200 }),
  };
  mockFrom.mockReturnValue(query as never);
  expect(await updateHabit(habitId, input)).toMatchObject({
    ok: false,
    error: { code: 'not_found' },
  });
  expect(await fetchHabit(habitId, 'Europe/Madrid')).toMatchObject({
    ok: false,
    error: { code: 'not_found' },
  });
});

import { afterAll, beforeAll, expect, it, jest } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createHabit,
  fetchHabit,
  updateHabit,
  changeHabitRule,
  moveHabitStartDate,
  archiveHabit,
  type HabitInput,
} from './habits';
import { supabase } from './supabase/client';
import {
  createAdminClient,
  createTestUser,
  deleteTestUser,
  type TestUser,
} from './supabase/local-supabase';
import { getOccurrencesInRange } from '../domain/recurrence';
import { toHabitSchedule } from '../domain/entities';
import { unwrapResult } from './result';

jest.mock('./supabase/client', () => {
  const { createClient } = jest.requireActual<
    typeof import('@supabase/supabase-js')
  >('@supabase/supabase-js');
  return {
    supabase: createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL!,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    ),
  };
});
let adminClient: SupabaseClient;
let owner: TestUser;
const today = '2026-10-07';
const input: HabitInput = {
  name: 'Lavarme los dientes',
  categoryId: null,
  sectionId: null,
  startDate: today,
  timeOfDay: null,
  timeSlot: 'night',
  frequency: 'daily',
  weekdays: [],
  intervalDays: null,
};

beforeAll(async () => {
  adminClient = createAdminClient();
  owner = await createTestUser(adminClient);
  const session = await owner.client.auth.getSession();
  if (!session.data.session) {
    throw new Error('Test session required');
  }
  const authentication = await supabase.auth.setSession(session.data.session);
  expect(authentication.error).toBeNull();
}, 35000);

afterAll(async () => {
  await deleteTestUser(adminClient, owner);
});

it('CU-01 scenario 1 creates a daily pending occurrence at 21:00', async () => {
  const created = unwrapResult(await createHabit(input));
  const habit = unwrapResult(await fetchHabit(created.id, 'Europe/Madrid'));
  const occurrences = getOccurrencesInRange(
    toHabitSchedule(habit),
    today,
    today,
  );
  expect(occurrences).toEqual([
    { habitId: created.id, date: today, sortTime: '21:00' },
  ]);
  const marks = await owner.client
    .from('habit_marks')
    .select('*')
    .eq('habit_id', created.id);
  expect(marks.data).toEqual([]);
});

it('CU-01 scenarios 5 and 6 never save an empty name or zero interval', async () => {
  expect(await createHabit({ ...input, name: '' })).toMatchObject({
    ok: false,
    error: { code: 'invalid_input' },
  });
  expect(
    await createHabit({
      ...input,
      name: 'Invalid interval',
      frequency: 'every_n_days',
      intervalDays: 0,
    }),
  ).toMatchObject({ ok: false, error: { code: 'invalid_input' } });
  const habits = await owner.client
    .from('habits')
    .select('id')
    .eq('name', 'Invalid interval');
  expect(habits.data).toEqual([]);
});

it('CU-06 scenarios 1, 2 and 4 preserve ten past occurrences and marks when renaming and switching to Wednesdays', async () => {
  const created = unwrapResult(
    await createHabit({ ...input, startDate: '2026-09-27' }),
  );
  const before = unwrapResult(await fetchHabit(created.id, 'Europe/Madrid'));
  const pastBefore = getOccurrencesInRange(
    toHabitSchedule(before),
    '2026-09-27',
    '2026-10-06',
  );
  expect(pastBefore).toHaveLength(10);
  const markRows = pastBefore.map((occurrence) => ({
    habit_id: created.id,
    occurrence_date: occurrence.date,
    status: 'done',
  }));
  const inserted = await owner.client.from('habit_marks').insert(markRows);
  expect(inserted.error).toBeNull();
  const marksBefore = await owner.client
    .from('habit_marks')
    .select('*')
    .eq('habit_id', created.id)
    .order('occurrence_date');
  expect(
    unwrapResult(
      await updateHabit(created.id, { ...input, name: 'Dientes limpios' }),
    ),
  ).toBeNull();
  expect(
    unwrapResult(
      await changeHabitRule(
        created.id,
        { frequency: 'weekdays', weekdays: [3], intervalDays: null },
        today,
      ),
    ),
  ).toBeNull();
  const after = unwrapResult(await fetchHabit(created.id, 'Europe/Madrid'));
  expect(after.name).toBe('Dientes limpios');
  const pastAfter = getOccurrencesInRange(
    toHabitSchedule(after),
    '2026-09-27',
    '2026-10-06',
  );
  expect(pastAfter).toEqual(pastBefore);
  const future = getOccurrencesInRange(
    toHabitSchedule(after),
    today,
    '2026-10-21',
  );
  expect(future.map((occurrence) => occurrence.date)).toEqual([
    '2026-10-07',
    '2026-10-14',
    '2026-10-21',
  ]);
  const marksAfter = await owner.client
    .from('habit_marks')
    .select('*')
    .eq('habit_id', created.id)
    .order('occurrence_date');
  expect(marksAfter.data).toEqual(marksBefore.data);
  expect(
    await updateHabit(created.id, { ...input, name: '   ' }),
  ).toMatchObject({ ok: false, error: { code: 'invalid_input' } });
  expect(unwrapResult(await fetchHabit(created.id, 'Europe/Madrid')).name).toBe(
    'Dientes limpios',
  );
});

it('CU-06 scenario 3 archives while keeping the past marks and history', async () => {
  const created = unwrapResult(
    await createHabit({ ...input, startDate: '2026-09-27' }),
  );
  const marked = await owner.client.from('habit_marks').insert({
    habit_id: created.id,
    occurrence_date: '2026-09-27',
    status: 'done',
  });
  expect(marked.error).toBeNull();
  expect(unwrapResult(await archiveHabit(created.id))).toBeNull();
  const habit = unwrapResult(await fetchHabit(created.id, 'Europe/Madrid'));
  expect(habit.archivedOn).not.toBeNull();
  const active = await owner.client
    .from('habits')
    .select('id')
    .eq('id', created.id)
    .is('archived_at', null);
  expect(active.data).toEqual([]);
  const marks = await owner.client
    .from('habit_marks')
    .select('*')
    .eq('habit_id', created.id);
  expect(marks.data).toHaveLength(1);
  const history = getOccurrencesInRange(
    toHabitSchedule(habit),
    '2026-09-27',
    '2026-09-27',
  );
  expect(history).toHaveLength(1);
});

it('edits a future start and changes its single initial rule without creating invalid schedules', async () => {
  const created = unwrapResult(
    await createHabit({ ...input, startDate: '2026-11-01' }),
  );
  expect(
    unwrapResult(await moveHabitStartDate(created.id, '2026-11-03', today)),
  ).toBeNull();
  expect(
    unwrapResult(
      await changeHabitRule(
        created.id,
        { frequency: 'monthly', weekdays: [], intervalDays: null },
        today,
      ),
    ),
  ).toBeNull();
  const habit = unwrapResult(await fetchHabit(created.id, 'Europe/Madrid'));
  expect(habit.startDate).toBe('2026-11-03');
  expect(habit.ruleVersions).toEqual([
    {
      validFrom: '2026-11-03',
      frequency: 'monthly',
      weekdays: [],
      intervalDays: null,
    },
  ]);
  expect(
    getOccurrencesInRange(toHabitSchedule(habit), today, '2026-12-03').map(
      (occurrence) => occurrence.date,
    ),
  ).toEqual(['2026-11-03', '2026-12-03']);
});

it('changing to the current rule preserves its versions and interval anchor', async () => {
  const created = unwrapResult(
    await createHabit({
      ...input,
      startDate: '2026-10-01',
      frequency: 'every_n_days',
      intervalDays: 3,
    }),
  );
  const before = unwrapResult(await fetchHabit(created.id, 'Europe/Madrid'));
  const changed = await changeHabitRule(
    created.id,
    {
      frequency: 'every_n_days',
      weekdays: [],
      intervalDays: 3,
    },
    today,
  );
  expect(unwrapResult(changed)).toBeNull();
  const after = unwrapResult(await fetchHabit(created.id, 'Europe/Madrid'));
  expect(after.ruleVersions).toEqual(before.ruleVersions);
});

it('cannot archive twice or move the existing archive date', async () => {
  const created = unwrapResult(await createHabit(input));
  expect(unwrapResult(await archiveHabit(created.id))).toBeNull();
  const before = await owner.client
    .from('habits')
    .select('archived_at')
    .eq('id', created.id)
    .single();
  expect(before.error).toBeNull();
  expect(await archiveHabit(created.id)).toMatchObject({
    ok: false,
    error: { code: 'not_found' },
  });
  const after = await owner.client
    .from('habits')
    .select('archived_at')
    .eq('id', created.id)
    .single();
  expect(after.error).toBeNull();
  expect(after.data).toEqual(before.data);
});

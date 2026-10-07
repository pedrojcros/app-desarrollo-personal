import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { ViewItem } from '../domain/items';
import { fetchPastPending } from './past-pending';
import { unwrapResult } from './result';
import { setMarkStatus } from './set-mark-status';
import { supabase } from './supabase/client';
import {
  createAdminClient,
  createTestUser,
  deleteTestUser,
  waitForLocalSchema,
  type TestUser,
} from './supabase/local-supabase';
import { createTask, rescheduleTask } from './tasks';
import { fetchTodayView } from './today';

jest.mock('./supabase/client', () => {
  const { createClient } = jest.requireActual<
    typeof import('@supabase/supabase-js')
  >('@supabase/supabase-js');
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Local Supabase environment variables are required');
  }
  return {
    supabase: createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  };
});

const today = '2026-10-07';
const yesterday = '2026-10-06';
const tomorrow = '2026-10-08';

let adminClient: SupabaseClient;
let owner: TestUser;

async function createOverdueTask(name: string): Promise<string> {
  const result = await createTask({
    name,
    notes: null,
    dueDate: yesterday,
    dueTime: '10:00',
    categoryId: null,
    sectionId: null,
  });
  return unwrapResult(result).id;
}

async function createDailyHabit(name: string): Promise<void> {
  const habit = await owner.client
    .from('habits')
    .insert({ name, start_date: yesterday })
    .select('id')
    .single();
  expect(habit.error).toBeNull();
  const rule = await owner.client.from('habit_rules').insert({
    habit_id: habit.data?.id,
    valid_from: yesterday,
    frequency: 'daily',
  });
  expect(rule.error).toBeNull();
}

async function readPastPendingNames(): Promise<string[]> {
  const data = unwrapResult(await fetchPastPending(today));
  return data.items.map((item) => item.name);
}

async function readTodayNames(): Promise<string[]> {
  const data = unwrapResult(await fetchTodayView(today));
  return data.items.map((item) => item.name);
}

beforeAll(async () => {
  await waitForLocalSchema();
  adminClient = createAdminClient();
  owner = await createTestUser(adminClient);
  const session = await owner.client.auth.getSession();
  if (!session.data.session) {
    throw new Error('A test session is required');
  }
  const authentication = await supabase.auth.setSession(session.data.session);
  expect(authentication.error).toBeNull();
}, 35000);

afterAll(async () => {
  await supabase.auth.signOut();
  if (owner) {
    await deleteTestUser(adminClient, owner);
  }
});

describe('CU-04 scenario 2: reschedule an overdue task', () => {
  it('leaves the past pending list and shows up on its new day', async () => {
    const taskId = await createOverdueTask('Entregar informe');
    expect(await readPastPendingNames()).toContain('Entregar informe');

    unwrapResult(await rescheduleTask(taskId, tomorrow, today));

    expect(await readPastPendingNames()).not.toContain('Entregar informe');
    expect(await readTodayNames()).not.toContain('Entregar informe');
  });

  it('shows up in Today when rescheduled to today', async () => {
    const taskId = await createOverdueTask('Llamar al banco');

    unwrapResult(await rescheduleTask(taskId, today, today));

    expect(await readPastPendingNames()).not.toContain('Llamar al banco');
    expect(await readTodayNames()).toContain('Llamar al banco');
  });
});

describe('CU-04 scenario 3: reschedule to the past', () => {
  it('keeps the task in the past pending list', async () => {
    const taskId = await createOverdueTask('Renovar el carné');

    const result = await rescheduleTask(taskId, '2026-10-05', today);

    expect(result).toMatchObject({ ok: false, error: { code: 'past_date' } });
    expect(await readPastPendingNames()).toContain('Renovar el carné');
  });
});

describe('CU-04 scenario 4: a whole day as not done', () => {
  it('leaves nothing pending on that day, occurrences and tasks alike', async () => {
    await createDailyHabit('Hábito uno');
    await createDailyHabit('Hábito dos');
    await createOverdueTask('Tarea vencida del día');
    const data = unwrapResult(await fetchPastPending(today));
    const dayItems: ViewItem[] = data.items.filter(
      (item) => item.date === yesterday,
    );
    expect(dayItems.length).toBeGreaterThanOrEqual(3);

    for (const item of dayItems) {
      unwrapResult(await setMarkStatus(item.target, 'not_done', today));
    }

    const remaining = unwrapResult(await fetchPastPending(today));
    const remainingOfThatDay = remaining.items.filter(
      (item) => item.date === yesterday,
    );
    expect(remainingOfThatDay).toEqual([]);
  });
});

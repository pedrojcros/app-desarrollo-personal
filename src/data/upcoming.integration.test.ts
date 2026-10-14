import { afterAll, beforeAll, expect, it, jest } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createAdminClient,
  createTestUser,
  deleteTestUser,
  waitForLocalSchema,
  type TestUser,
} from './supabase/local-supabase';
import { supabase } from './supabase/client';
import { fetchUpcomingView } from './upcoming';
import { unwrapResult } from './result';

jest.mock('./supabase/client', () => {
  const { createClient } = jest.requireActual<
    typeof import('@supabase/supabase-js')
  >('@supabase/supabase-js');
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const publicKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !publicKey) {
    throw new Error('Local Supabase environment variables are required');
  }
  return {
    supabase: createClient(url, publicKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  };
});
let adminClient: SupabaseClient;
let user: TestUser;
let swimId: string;
beforeAll(async () => {
  await waitForLocalSchema();
  adminClient = createAdminClient();
  user = await createTestUser(adminClient);
  const session = await user.client.auth.getSession();
  if (!session.data.session) {
    throw new Error('Test user must have a session');
  }
  const authentication = await supabase.auth.setSession(session.data.session);
  expect(authentication.error).toBeNull();
  const habits = await supabase
    .from('habits')
    .insert([
      { name: 'Nadar', start_date: '2026-10-01' },
      { name: 'Diario', start_date: '2026-10-01' },
    ])
    .select('id,name');
  if (habits.error) {
    throw habits.error;
  }
  const swim = habits.data.find((habit) => habit.name === 'Nadar');
  const daily = habits.data.find((habit) => habit.name === 'Diario');
  if (!swim || !daily) {
    throw new Error('Seed habits must exist');
  }
  swimId = swim.id;
  const rules = await supabase.from('habit_rules').insert([
    {
      habit_id: swim.id,
      valid_from: '2026-10-01',
      frequency: 'weekdays',
      weekdays: [3],
    },
    { habit_id: daily.id, valid_from: '2026-10-01', frequency: 'daily' },
  ]);
  expect(rules.error).toBeNull();
  const marks = await supabase.from('habit_marks').insert([
    { habit_id: swim.id, occurrence_date: '2026-10-14', status: 'done' },
    { habit_id: swim.id, occurrence_date: '2026-10-21', status: 'not_done' },
    { habit_id: swim.id, occurrence_date: '2026-11-18', status: 'done' },
  ]);
  expect(marks.error).toBeNull();
  const tasks = await supabase.from('tasks').insert([
    { status: 'pending', name: 'Today', due_date: '2026-10-14' },
    { status: 'pending', name: 'Tomorrow', due_date: '2026-10-15' },
    { status: 'pending', name: 'Last Sunday', due_date: '2026-11-15' },
    { status: 'pending', name: 'After range', due_date: '2026-11-16' },
    { status: 'pending', name: 'Undated' },
    {
      status: 'pending',
      name: 'Archived',
      due_date: '2026-10-20',
      archived_at: '2026-10-14T10:00:00Z',
    },
    {
      name: 'Done',
      due_date: '2026-10-20',
      status: 'done',
      marked_at: '2026-10-14T10:00:00Z',
    },
  ]);
  expect(tasks.error).toBeNull();
}, 35000);
afterAll(async () => {
  await supabase.auth.signOut();
  if (user) {
    await deleteTestUser(adminClient, user);
  }
});
it('reads tomorrow through the fourth Sunday, weekly habits and range marks', async () => {
  const result = await fetchUpcomingView('2026-10-14', 'Europe/Madrid');
  const data = unwrapResult(result);
  const taskItems = data.items.filter((item) => item.target.kind === 'task');
  expect(taskItems.map((item) => [item.name, item.date])).toEqual([
    ['Tomorrow', '2026-10-15'],
    ['Last Sunday', '2026-11-15'],
  ]);
  const habitItems = data.items.filter(
    (item) => item.target.kind === 'occurrence',
  );
  expect(habitItems.map((item) => [item.name, item.date, item.status])).toEqual(
    [
      ['Nadar', '2026-10-21', 'not_done'],
      ['Nadar', '2026-10-28', 'pending'],
      ['Nadar', '2026-11-04', 'pending'],
      ['Nadar', '2026-11-11', 'pending'],
    ],
  );
  expect(habitItems[0].target).toEqual({
    kind: 'occurrence',
    habitId: swimId,
    date: '2026-10-21',
  });
});
it('reads tasks beyond the first REST page', async () => {
  const tasks = Array.from({ length: 1001 }, (_unused, index) => ({
    name: `Paged task ${index}`,
    due_date: '2026-10-16',
  }));
  const inserted = await supabase.from('tasks').insert(tasks);
  expect(inserted.error).toBeNull();
  const result = await fetchUpcomingView('2026-10-14', 'Europe/Madrid');
  const data = unwrapResult(result);
  const pagedItems = data.items.filter((item) => item.date === '2026-10-16');
  expect(pagedItems).toHaveLength(1001);
});

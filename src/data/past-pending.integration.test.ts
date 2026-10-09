import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';

import { fetchPastPending } from './past-pending';
import { unwrapResult } from './result';
import { supabase } from './supabase/client';
import {
  createAdminClient,
  createTestUser,
  deleteTestUser,
  waitForLocalSchema,
  type TestUser,
} from './supabase/local-supabase';

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

let adminClient: SupabaseClient;
let owner: TestUser;
let otherUser: TestUser;
const today = '2026-10-07';

beforeAll(async () => {
  await waitForLocalSchema();
  adminClient = createAdminClient();
  owner = await createTestUser(adminClient);
  otherUser = await createTestUser(adminClient);
  const session = await owner.client.auth.getSession();
  if (!session.data.session) {
    throw new Error('A test session is required');
  }
  const authentication = await supabase.auth.setSession(session.data.session);
  expect(authentication.error).toBeNull();
  const tasks = await owner.client.from('tasks').insert([
    { name: 'Vencida', due_date: '2026-10-05', status: 'pending' },
    { name: 'De hoy', due_date: today, status: 'pending' },
    { name: 'Sin fecha', status: 'pending' },
    { name: 'Resuelta', due_date: '2026-10-05', status: 'done' },
    {
      name: 'Archivada',
      due_date: '2026-10-05',
      status: 'pending',
      archived_at: '2026-10-06T08:00:00Z',
    },
  ]);
  expect(tasks.error).toBeNull();
  const foreignTask = await otherUser.client
    .from('tasks')
    .insert({ name: 'Ajena', due_date: '2026-10-05' });
  expect(foreignTask.error).toBeNull();
  const habits = await owner.client
    .from('habits')
    .insert([
      { name: 'Leer', start_date: '2026-10-04' },
      {
        name: 'Archivado',
        start_date: '2026-10-04',
        archived_at: '2026-10-05T08:00:00Z',
      },
    ])
    .select('id, name');
  expect(habits.error).toBeNull();
  if (habits.data === null) {
    throw new Error('Test habits were not created');
  }
  const rules = habits.data.map((habit: { id: string }) => ({
    habit_id: habit.id,
    valid_from: '2026-10-04',
    frequency: 'daily',
  }));
  const ruleResponse = await owner.client.from('habit_rules').insert(rules);
  expect(ruleResponse.error).toBeNull();
  const reading = habits.data.find(
    (habit: { name: string }) => habit.name === 'Leer',
  );
  if (reading === undefined) {
    throw new Error('Test habit was not created');
  }
  const mark = await owner.client.from('habit_marks').insert({
    habit_id: reading.id,
    occurrence_date: '2026-10-05',
    status: 'done',
    marked_at: '2026-10-05T20:00:00Z',
  });
  expect(mark.error).toBeNull();
}, 35000);

afterAll(async () => {
  await supabase.auth.signOut();
  if (owner) {
    await deleteTestUser(adminClient, owner);
  }
  if (otherUser) {
    await deleteTestUser(adminClient, otherUser);
  }
});

describe('Past pending against local Supabase', () => {
  it('reads unmarked past occurrences and overdue tasks, respecting RLS', async () => {
    const data = unwrapResult(await fetchPastPending(today));
    const described = data.items.map((item) => `${item.date} ${item.name}`);
    expect(described).toEqual([
      '2026-10-06 Leer',
      '2026-10-05 Vencida',
      '2026-10-04 Leer',
    ]);
  });
});

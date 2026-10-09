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
import { fetchHistory } from './history';
import { unwrapResult } from './result';
import { buildHistoryGrid } from '../domain/views/history';

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
  const habitResponse = await supabase
    .from('habits')
    .insert({
      name: 'Nadar',
      start_date: '2026-10-01',
      archived_at: '2026-10-05T10:00:00Z',
    })
    .select('id')
    .single();
  if (habitResponse.error) {
    throw habitResponse.error;
  }
  const rules = await supabase.from('habit_rules').insert({
    habit_id: habitResponse.data.id,
    valid_from: '2026-10-01',
    frequency: 'daily',
  });
  expect(rules.error).toBeNull();
  const marks = await supabase.from('habit_marks').insert({
    habit_id: habitResponse.data.id,
    occurrence_date: '2026-10-06',
    status: 'not_done',
  });
  expect(marks.error).toBeNull();
  const tasks = await supabase.from('tasks').insert([
    {
      name: 'Leche',
      status: 'done',
      marked_at: '2026-10-05T22:00:00Z',
      archived_at: '2026-10-07T10:00:00Z',
    },
    {
      name: 'Before midnight',
      status: 'done',
      marked_at: '2026-10-05T21:59:59Z',
    },
    { name: 'After range', status: 'done', marked_at: '2026-10-06T22:00:00Z' },
    { name: 'Dated', due_date: '2026-10-06', status: 'pending' },
    {
      name: 'Archived pending',
      status: 'pending',
      due_date: '2026-10-06',
      archived_at: '2026-10-07T10:00:00Z',
    },
    { name: 'No date', status: 'pending' },
  ]);
  expect(tasks.error).toBeNull();
}, 35000);
afterAll(async () => {
  await supabase.auth.signOut();
  if (user) {
    await deleteTestUser(adminClient, user);
  }
});
it('reads archived marks and UTC margins, then filters by the device day without partial data', async () => {
  const data = unwrapResult(
    await fetchHistory('2026-10-06', '2026-10-06', 'Europe/Madrid'),
  );
  const result = buildHistoryGrid(
    data.items,
    '2026-10-06',
    '2026-10-06',
    '2026-10-07',
    'Europe/Madrid',
  );
  expect(result.rows.map((row) => [row.name, row.cells])).toEqual([
    ['Nadar', ['not_done']],
    ['Dated', ['unmarked']],
    ['Leche', ['done']],
  ]);
  expect(result.dayPercentages).toEqual([33]);
});
it('reads more than one REST page of tasks', async () => {
  const tasks = Array.from({ length: 1001 }, (value, index) => ({
    name: `Task ${index}`,
    due_date: '2026-10-04',
  }));
  const inserted = await supabase.from('tasks').insert(tasks);
  expect(inserted.error).toBeNull();
  const data = unwrapResult(
    await fetchHistory('2026-10-04', '2026-10-04', 'Europe/Madrid'),
  );
  const result = buildHistoryGrid(
    data.items,
    '2026-10-04',
    '2026-10-04',
    '2026-10-07',
    'Europe/Madrid',
  );
  expect(result.rows).toHaveLength(1002);
});

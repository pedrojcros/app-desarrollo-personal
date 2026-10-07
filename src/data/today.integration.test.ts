import { afterAll, beforeAll, expect, it, jest } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';

import { summarizeDay } from '../domain/views/today';
import { unwrapResult } from './result';
import { supabase } from './supabase/client';
import {
  createAdminClient,
  createTestUser,
  deleteTestUser,
  waitForLocalSchema,
  type TestUser,
} from './supabase/local-supabase';
import { fetchTodayView } from './today';

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
  const habits = await user.client
    .from('habits')
    .insert([
      { name: 'Activo', start_date: '2026-10-01', time_slot: 'morning' },
      {
        name: 'Archivado',
        start_date: '2026-10-01',
        archived_at: '2026-10-06T10:00:00Z',
      },
    ])
    .select('id, name');
  if (habits.error) {
    throw habits.error;
  }
  const rules = habits.data.map((habit) => ({
    habit_id: habit.id,
    valid_from: '2026-10-01',
    frequency: 'daily',
  }));
  const rulesResponse = await user.client.from('habit_rules').insert(rules);
  expect(rulesResponse.error).toBeNull();
  const active = habits.data.find((habit) => habit.name === 'Activo')!;
  const marks = await user.client.from('habit_marks').insert([
    {
      habit_id: active.id,
      occurrence_date: '2026-10-06',
      status: 'not_done',
      marked_at: '2026-10-06T10:00:00Z',
    },
    {
      habit_id: active.id,
      occurrence_date: '2026-10-07',
      status: 'done',
      marked_at: '2026-10-07T09:00:00Z',
    },
  ]);
  expect(marks.error).toBeNull();
  const tasks = await user.client.from('tasks').insert([
    {
      name: 'Pendiente',
      due_date: '2026-10-07',
      due_time: '07:00:00',
      status: 'pending',
    },
    {
      name: 'Hecha',
      due_date: '2026-10-07',
      status: 'done',
      marked_at: '2026-10-07T07:00:00Z',
    },
    {
      name: 'No hecha',
      due_date: '2026-10-07',
      status: 'not_done',
      marked_at: '2026-10-07T08:00:00Z',
    },
    { name: 'Vencida', due_date: '2026-10-06', status: 'pending' },
    { name: 'Sin fecha', status: 'pending' },
    {
      name: 'Archivada',
      status: 'pending',
      due_date: '2026-10-07',
      archived_at: '2026-10-07T06:00:00Z',
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

it('loads only today with real filters and chronological mark progress', async () => {
  const response = await fetchTodayView('2026-10-07', 'Europe/Madrid');
  const { items } = unwrapResult(response);
  expect(items.map((item) => item.name)).toEqual([
    'Pendiente',
    'Activo',
    'Hecha',
    'No hecha',
  ]);
  const summary = summarizeDay(items);
  expect(summary.total).toBe(4);
  expect(summary.marked.map((item) => item.name)).toEqual([
    'Hecha',
    'No hecha',
    'Activo',
  ]);
  expect(items[1].status).toBe('done');
  expect(items[1].date).toBe('2026-10-07');
});

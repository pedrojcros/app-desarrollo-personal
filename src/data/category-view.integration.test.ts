import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';

import { fetchCategoryView } from './category-view';
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
let categoryId: string;
let sectionId: string;
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
  const category = await owner.client
    .from('categories')
    .insert({ name: 'Compra', icon: 'shopping-cart', color: 'teal' })
    .select('id')
    .single();
  expect(category.error).toBeNull();
  if (category.data === null) {
    throw new Error('Test category was not created');
  }
  categoryId = category.data.id;
  const section = await owner.client
    .from('sections')
    .insert({ name: 'Mercadona', category_id: categoryId })
    .select('id')
    .single();
  expect(section.error).toBeNull();
  if (section.data === null) {
    throw new Error('Test section was not created');
  }
  sectionId = section.data.id;
  const tasks = await owner.client.from('tasks').insert([
    {
      name: 'Leche',
      category_id: categoryId,
      section_id: sectionId,
      status: 'pending',
    },
    {
      name: 'Vencida',
      status: 'pending',
      category_id: categoryId,
      due_date: '2026-10-06',
      due_time: '08:30:00',
    },
    {
      name: 'Futura',
      category_id: categoryId,
      due_date: '2026-10-08',
      status: 'pending',
    },
    {
      name: 'Hecha',
      category_id: categoryId,
      status: 'done',
      marked_at: '2026-10-07T08:00:00Z',
    },
    {
      name: 'No hecha',
      category_id: categoryId,
      status: 'not_done',
      marked_at: '2026-10-07T08:00:00Z',
    },
    {
      name: 'Archivada',
      status: 'pending',
      category_id: categoryId,
      archived_at: '2026-10-06T08:00:00Z',
    },
    { name: 'Banco', status: 'pending' },
    { name: 'Correo', due_date: today, status: 'pending' },
  ]);
  expect(tasks.error).toBeNull();
  const foreignTask = await otherUser.client
    .from('tasks')
    .insert({ name: 'Other user Inbox' });
  expect(foreignTask.error).toBeNull();
  const habits = await owner.client
    .from('habits')
    .insert([
      {
        name: 'Leer',
        category_id: categoryId,
        section_id: sectionId,
        start_date: '2026-01-01',
        time_of_day: '09:00:00',
      },
      { name: 'No toca', category_id: categoryId, start_date: '2026-01-01' },
      { name: 'Marcado', category_id: categoryId, start_date: '2026-01-01' },
      {
        name: 'Archivado',
        category_id: categoryId,
        start_date: '2026-01-01',
        archived_at: '2026-10-06T08:00:00Z',
      },
      { name: 'Pasear', start_date: '2026-01-01' },
    ])
    .select('id, name');
  expect(habits.error).toBeNull();
  if (habits.data === null) {
    throw new Error('Test habits were not created');
  }
  const rules = habits.data.map((habit: { id: string; name: string }) => ({
    habit_id: habit.id,
    valid_from: '2026-01-01',
    frequency: habit.name === 'No toca' ? 'weekdays' : 'daily',
    weekdays: habit.name === 'No toca' ? [1] : null,
  }));
  const ruleResponse = await owner.client.from('habit_rules').insert(rules);
  expect(ruleResponse.error).toBeNull();
  const marked = habits.data.find(
    (habit: { name: string }) => habit.name === 'Marcado',
  );
  if (marked === undefined) {
    throw new Error('Marked test habit was not created');
  }
  const mark = await owner.client.from('habit_marks').insert({
    habit_id: marked.id,
    occurrence_date: today,
    status: 'not_done',
    marked_at: '2026-10-07T08:00:00Z',
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

describe('Category view against local Supabase', () => {
  it('reads pending active contents, all task dates and only today’s pending habits', async () => {
    const data = unwrapResult(await fetchCategoryView(categoryId, today));
    expect(data.items.map((item) => item.name)).toEqual([
      'Vencida',
      'Leer',
      'Futura',
      'Leche',
    ]);
    expect(data.items[0].sortTime).toBe('08:30');
    expect(data.items[1].sectionId).toBe(sectionId);
    expect(data.items[3].sectionId).toBe(sectionId);
  });
  it('reads Inbox tasks with and without dates and its due habit, respecting RLS', async () => {
    const data = unwrapResult(await fetchCategoryView(null, today));
    expect(data.items.map((item) => item.name)).toEqual([
      'Correo',
      'Pasear',
      'Banco',
    ]);
    expect(data.items.every((item) => item.categoryId === null)).toBe(true);
  });
  it('removes resolved tasks after re-reading the view', async () => {
    const response = await owner.client
      .from('tasks')
      .update({ status: 'done', marked_at: '2026-10-07T10:00:00Z' })
      .eq('name', 'Leche');
    expect(response.error).toBeNull();
    const data = unwrapResult(await fetchCategoryView(categoryId, today));
    expect(data.items.map((item) => item.name)).toEqual([
      'Vencida',
      'Leer',
      'Futura',
    ]);
  });
});

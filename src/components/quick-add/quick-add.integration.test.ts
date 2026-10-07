import { jest, beforeAll, afterAll, expect, it } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createCategory } from '../../data/categories';
import { createSection } from '../../data/sections';
import { createTask, fetchTask } from '../../data/tasks';
import { fetchTodayView } from '../../data/today';
import { supabase } from '../../data/supabase/client';
import {
  createAdminClient,
  createTestUser,
  deleteTestUser,
  waitForLocalSchema,
  type TestUser,
} from '../../data/supabase/local-supabase';
import { getQuickAddDefaults } from '../../domain/quick-add';

// Solo se sustituye el almacenamiento nativo; las escrituras usan Supabase real.
jest.mock('../../data/supabase/client', () => {
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
}, 35000);
afterAll(async () => {
  await deleteTestUser(adminClient, user);
});
it('CU-02.6 creates an undated task in the selected category section', async () => {
  const category = await createCategory({
    name: 'Lista de la compra',
    icon: 'shopping-cart',
    color: 'teal',
  });
  if (!category.ok) {
    throw new Error(category.error.message);
  }
  const section = await createSection({
    categoryId: category.value.id,
    name: 'Mercadona',
  });
  if (!section.ok) {
    throw new Error(section.error.message);
  }
  const defaults = getQuickAddDefaults(
    {
      kind: 'section',
      categoryId: category.value.id,
      sectionId: section.value.id,
    },
    '2026-10-07',
  );
  const created = await createTask({
    name: 'Plátanos',
    ...defaults,
    notes: null,
    dueTime: null,
  });
  if (!created.ok) {
    throw new Error(created.error.message);
  }
  const task = await fetchTask(created.value.id, 'Europe/Madrid');
  expect(task).toMatchObject({
    ok: true,
    value: {
      name: 'Plátanos',
      categoryId: category.value.id,
      sectionId: section.value.id,
      dueDate: null,
      status: 'pending',
    },
  });
});
it('CU-02.7 creates a task for today and returns it in the agenda', async () => {
  const defaults = getQuickAddDefaults({ kind: 'today' }, '2026-10-07');
  const created = await createTask({
    name: 'Comprar pilas',
    ...defaults,
    notes: null,
    dueTime: null,
  });
  if (!created.ok) {
    throw new Error(created.error.message);
  }
  const task = await fetchTask(created.value.id, 'Europe/Madrid');
  expect(task).toMatchObject({
    ok: true,
    value: {
      name: 'Comprar pilas',
      dueDate: '2026-10-07',
      categoryId: null,
      sectionId: null,
      status: 'pending',
    },
  });
  const agenda = await fetchTodayView('2026-10-07', 'Europe/Madrid');
  expect(agenda.ok).toBe(true);
  if (agenda.ok) {
    expect(agenda.value.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          target: { kind: 'task', taskId: created.value.id },
          name: 'Comprar pilas',
        }),
      ]),
    );
  }
});

import { describe, expect, it } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  createAdminClient,
  createTestUser,
  deleteTestUser,
} from './local-supabase';

const TABLE_NAMES = [
  'categories',
  'sections',
  'habits',
  'habit_rules',
  'habit_marks',
  'tasks',
];

async function insertId(
  client: SupabaseClient,
  table: string,
  payload: Record<string, unknown>,
): Promise<string> {
  const response = await client
    .from(table)
    .insert(payload)
    .select('id')
    .single();
  if (response.error) {
    throw new Error(
      `Could not insert into ${table}: ${response.error.message}`,
    );
  }
  return response.data.id;
}

async function countRows(
  adminClient: SupabaseClient,
  table: string,
  filter: Record<string, string>,
): Promise<number> {
  const response = await adminClient
    .from(table)
    .select('*', { count: 'exact', head: true })
    .match(filter);
  expect(response.error).toBeNull();
  return response.count ?? 0;
}

describe('Cascading deletes', () => {
  it('removes the rows of all six tables when the user is deleted', async () => {
    const adminClient = createAdminClient();
    const user = await createTestUser(adminClient);
    const categoryId = await insertId(user.client, 'categories', {
      name: 'Home',
    });
    const sectionId = await insertId(user.client, 'sections', {
      category_id: categoryId,
      name: 'Kitchen',
    });
    const habitId = await insertId(user.client, 'habits', {
      category_id: categoryId,
      section_id: sectionId,
      name: 'Water the plants',
      start_date: '2026-10-01',
    });
    await insertId(user.client, 'habit_rules', {
      habit_id: habitId,
      valid_from: '2026-10-01',
      frequency: 'daily',
    });
    await user.client.from('habit_marks').insert({
      habit_id: habitId,
      occurrence_date: '2026-10-02',
      status: 'done',
    });
    await insertId(user.client, 'tasks', { name: 'Pay the rent' });

    await deleteTestUser(adminClient, user);

    for (const table of TABLE_NAMES) {
      const remainingRows = await countRows(adminClient, table, {
        user_id: user.id,
      });
      expect(remainingRows).toBe(0);
    }
  });

  it('removes the rules and marks of a habit when the habit is deleted', async () => {
    const adminClient = createAdminClient();
    const user = await createTestUser(adminClient);
    const habitId = await insertId(user.client, 'habits', {
      name: 'Stretch',
      start_date: '2026-10-01',
    });
    await insertId(user.client, 'habit_rules', {
      habit_id: habitId,
      valid_from: '2026-10-01',
      frequency: 'daily',
    });
    await user.client.from('habit_marks').insert({
      habit_id: habitId,
      occurrence_date: '2026-10-02',
      status: 'done',
    });

    const deletion = await user.client
      .from('habits')
      .delete()
      .eq('id', habitId);

    expect(deletion.error).toBeNull();
    const rulesLeft = await countRows(adminClient, 'habit_rules', {
      habit_id: habitId,
    });
    const marksLeft = await countRows(adminClient, 'habit_marks', {
      habit_id: habitId,
    });
    expect(rulesLeft).toBe(0);
    expect(marksLeft).toBe(0);

    await deleteTestUser(adminClient, user);
  });
});

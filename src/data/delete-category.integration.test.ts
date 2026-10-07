import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

import {
  createAdminClient,
  createAnonymousClient,
  createTestUser,
  deleteTestUser,
  waitForLocalSchema,
  type TestUser,
} from './supabase/local-supabase';

// La función delete_category, probada con dos usuarios y sin pasar por la app.
let adminClient: SupabaseClient;
let owner: TestUser;
let intruder: TestUser;

type Fixture = {
  categoryId: string;
  sectionId: string;
  taskId: string;
  archivedHabitId: string;
};

async function createFixture(): Promise<Fixture> {
  const category = await owner.client
    .from('categories')
    .insert({ name: `Fixture ${randomUUID()}` })
    .select('id')
    .single();
  const section = await owner.client
    .from('sections')
    .insert({ name: 'Sección', category_id: category.data?.id })
    .select('id')
    .single();
  const task = await owner.client
    .from('tasks')
    .insert({
      name: 'Tarea',
      category_id: category.data?.id,
      section_id: section.data?.id,
    })
    .select('id')
    .single();
  const habit = await owner.client
    .from('habits')
    .insert({
      name: 'Hábito archivado',
      start_date: '2026-10-01',
      category_id: category.data?.id,
      section_id: section.data?.id,
      archived_at: '2026-10-02T10:00:00Z',
    })
    .select('id')
    .single();
  if (!category.data || !section.data || !task.data || !habit.data) {
    throw new Error('Could not create the fixture');
  }
  return {
    categoryId: category.data.id,
    sectionId: section.data.id,
    taskId: task.data.id,
    archivedHabitId: habit.data.id,
  };
}

async function countRows(table: 'categories' | 'sections', id: string) {
  const response = await owner.client
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('id', id);
  return response.count;
}

beforeAll(async () => {
  await waitForLocalSchema();
  adminClient = createAdminClient();
  owner = await createTestUser(adminClient);
  intruder = await createTestUser(adminClient);
}, 35000);

afterAll(async () => {
  await deleteTestUser(adminClient, owner);
  await deleteTestUser(adminClient, intruder);
});

describe('delete_category', () => {
  it('moves habits (archived too) and tasks to the Inbox and deletes the sections', async () => {
    const fixture = await createFixture();

    const response = await owner.client.rpc('delete_category', {
      target_category_id: fixture.categoryId,
    });

    expect(response.error).toBeNull();
    expect(await countRows('categories', fixture.categoryId)).toBe(0);
    expect(await countRows('sections', fixture.sectionId)).toBe(0);
    const task = await owner.client
      .from('tasks')
      .select('category_id, section_id')
      .eq('id', fixture.taskId)
      .single();
    const habit = await owner.client
      .from('habits')
      .select('category_id, section_id')
      .eq('id', fixture.archivedHabitId)
      .single();
    expect(task.data).toEqual({ category_id: null, section_id: null });
    expect(habit.data).toEqual({ category_id: null, section_id: null });
  });

  it('fails with category_not_found when the category does not exist', async () => {
    const response = await owner.client.rpc('delete_category', {
      target_category_id: randomUUID(),
    });

    expect(response.error?.code).toBe('P0002');
    expect(response.error?.message).toBe('category_not_found');
  });

  it("does not let another user delete or empty someone else's category", async () => {
    const fixture = await createFixture();

    const response = await intruder.client.rpc('delete_category', {
      target_category_id: fixture.categoryId,
    });

    expect(response.error?.message).toBe('category_not_found');
    expect(await countRows('categories', fixture.categoryId)).toBe(1);
    const task = await owner.client
      .from('tasks')
      .select('category_id, section_id')
      .eq('id', fixture.taskId)
      .single();
    expect(task.data).toEqual({
      category_id: fixture.categoryId,
      section_id: fixture.sectionId,
    });
  });

  // La función es una sola transacción: si lanza la excepción, Postgres deshace
  // también el traslado a la Bandeja. Aquí se comprueba el resultado visible.
  it('leaves everything in place when it fails', async () => {
    const fixture = await createFixture();
    const response = await intruder.client.rpc('delete_category', {
      target_category_id: fixture.categoryId,
    });

    const habit = await owner.client
      .from('habits')
      .select('category_id, section_id')
      .eq('id', fixture.archivedHabitId)
      .single();

    expect(response.error?.message).toBe('category_not_found');
    expect(habit.data).toEqual({
      category_id: fixture.categoryId,
      section_id: fixture.sectionId,
    });
  });

  it('cannot be executed by anonymous visitors', async () => {
    const fixture = await createFixture();
    const anonymous = createAnonymousClient();

    const response = await anonymous.rpc('delete_category', {
      target_category_id: fixture.categoryId,
    });

    expect(response.error?.code).toBe('42501');
    expect(await countRows('categories', fixture.categoryId)).toBe(1);
  });
});

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  waitForLocalSchema,
  createAdminClient,
  createAnonymousClient,
  createTestUser,
  deleteTestUser,
  type TestUser,
} from './local-supabase';

const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';
const CHECK_VIOLATION = '23514';

let adminClient: SupabaseClient;
let user: TestUser;
let otherUser: TestUser;
let categoryId: string;
let otherCategoryId: string;
let sectionId: string;
let habitId: string;

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

beforeAll(async () => {
  await waitForLocalSchema();
  adminClient = createAdminClient();
  user = await createTestUser(adminClient);
  otherUser = await createTestUser(adminClient);

  categoryId = await insertId(user.client, 'categories', { name: 'Health' });
  otherCategoryId = await insertId(user.client, 'categories', { name: 'Work' });
  sectionId = await insertId(user.client, 'sections', {
    category_id: categoryId,
    name: 'Morning',
  });
  habitId = await insertId(user.client, 'habits', {
    category_id: categoryId,
    name: 'Stretch',
    start_date: '2026-10-01',
  });
}, 35000);

afterAll(async () => {
  await deleteTestUser(adminClient, user);
  await deleteTestUser(adminClient, otherUser);
});

describe('Categories and sections', () => {
  it('rejects a category name that only differs in capitalization', async () => {
    const response = await user.client
      .from('categories')
      .insert({ name: 'HEALTH' });

    expect(response.error?.code).toBe(UNIQUE_VIOLATION);
  });

  it('lets another user use the same category name', async () => {
    const response = await otherUser.client
      .from('categories')
      .insert({ name: 'Health' });

    expect(response.error).toBeNull();
  });

  it('rejects an empty category name', async () => {
    const response = await user.client
      .from('categories')
      .insert({ name: '  ' });

    expect(response.error?.code).toBe(CHECK_VIOLATION);
  });

  it('rejects a duplicated section name inside the same category', async () => {
    const response = await user.client
      .from('sections')
      .insert({ category_id: categoryId, name: 'morning' });

    expect(response.error?.code).toBe(UNIQUE_VIOLATION);
  });

  it('allows the same section name in another category', async () => {
    const response = await user.client
      .from('sections')
      .insert({ category_id: otherCategoryId, name: 'Morning' });

    expect(response.error).toBeNull();
  });
});

describe('Habits', () => {
  it('rejects time_of_day and time_slot together', async () => {
    const response = await user.client.from('habits').insert({
      name: 'Read',
      start_date: '2026-10-01',
      time_of_day: '08:30',
      time_slot: 'morning',
    });

    expect(response.error?.code).toBe(CHECK_VIOLATION);
  });

  it('accepts either time_of_day or time_slot alone', async () => {
    const withTime = await user.client.from('habits').insert({
      name: 'Read at a time',
      start_date: '2026-10-01',
      time_of_day: '08:30',
    });
    const withSlot = await user.client.from('habits').insert({
      name: 'Read in a slot',
      start_date: '2026-10-01',
      time_slot: 'night',
    });

    expect(withTime.error).toBeNull();
    expect(withSlot.error).toBeNull();
  });

  it('rejects a time_slot outside morning, afternoon and night', async () => {
    const response = await user.client.from('habits').insert({
      name: 'Read',
      start_date: '2026-10-01',
      time_slot: 'noon',
    });

    expect(response.error).not.toBeNull();
  });

  it('rejects a section from another category', async () => {
    const response = await user.client.from('habits').insert({
      category_id: otherCategoryId,
      section_id: sectionId,
      name: 'Wrong section',
      start_date: '2026-10-01',
    });

    expect(response.error?.code).toBe(FOREIGN_KEY_VIOLATION);
  });

  it('rejects a section when the habit is in the inbox', async () => {
    const response = await user.client.from('habits').insert({
      section_id: sectionId,
      name: 'Inbox with section',
      start_date: '2026-10-01',
    });

    expect(response.error?.code).toBe(CHECK_VIOLATION);
  });

  it('accepts a section of the same category', async () => {
    const response = await user.client.from('habits').insert({
      category_id: categoryId,
      section_id: sectionId,
      name: 'Right section',
      start_date: '2026-10-01',
    });

    expect(response.error).toBeNull();
  });
});

describe('Habit rules', () => {
  function insertRule(rule: Record<string, unknown>) {
    return user.client
      .from('habit_rules')
      .insert({ habit_id: habitId, valid_from: '2026-10-01', ...rule });
  }

  it('accepts ISO weekdays from 1 (Monday) to 7 (Sunday)', async () => {
    const response = await insertRule({
      frequency: 'weekdays',
      weekdays: [1, 7],
    });

    expect(response.error).toBeNull();
  });

  it.each([[[0]], [[8]], [[]]])('rejects the weekdays %j', async (weekdays) => {
    const response = await insertRule({ frequency: 'weekdays', weekdays });

    expect(response.error?.code).toBe(CHECK_VIOLATION);
  });

  it('rejects weekdays frequency with a null weekdays value', async () => {
    const response = await insertRule({
      frequency: 'weekdays',
      weekdays: null,
    });

    expect(response.error?.code).toBe(CHECK_VIOLATION);
  });

  it('rejects weekdays frequency with the weekdays field omitted', async () => {
    const response = await insertRule({ frequency: 'weekdays' });

    expect(response.error?.code).toBe(CHECK_VIOLATION);
  });

  it('requires interval_days of at least 1 for every_n_days', async () => {
    const missing = await insertRule({ frequency: 'every_n_days' });
    const zero = await insertRule({
      frequency: 'every_n_days',
      interval_days: 0,
    });
    const valid = await insertRule({
      frequency: 'every_n_days',
      interval_days: 3,
    });

    expect(missing.error?.code).toBe(CHECK_VIOLATION);
    expect(zero.error?.code).toBe(CHECK_VIOLATION);
    expect(valid.error).toBeNull();
  });

  it('rejects an unknown frequency', async () => {
    const response = await insertRule({ frequency: 'yearly' });

    expect(response.error).not.toBeNull();
  });
});

describe('Habit marks', () => {
  it('rejects a second mark for the same habit and day', async () => {
    const mark = {
      habit_id: habitId,
      occurrence_date: '2026-10-05',
      status: 'done',
    };
    const first = await user.client.from('habit_marks').insert(mark);
    const second = await user.client
      .from('habit_marks')
      .insert({ ...mark, status: 'not_done' });

    expect(first.error).toBeNull();
    expect(second.error?.code).toBe(UNIQUE_VIOLATION);
  });

  it('rejects a status other than done or not_done', async () => {
    const response = await user.client.from('habit_marks').insert({
      habit_id: habitId,
      occurrence_date: '2026-10-06',
      status: 'pending',
    });

    expect(response.error).not.toBeNull();
  });
});

describe('Tasks', () => {
  it('starts as pending and accepts the three statuses', async () => {
    const created = await user.client
      .from('tasks')
      .insert({ name: 'New task' })
      .select('status')
      .single();
    const invalid = await user.client
      .from('tasks')
      .insert({ name: 'Bad status', status: 'archived' });

    expect(created.data?.status).toBe('pending');
    expect(invalid.error).not.toBeNull();
  });

  it('rejects a section from another category', async () => {
    const response = await user.client.from('tasks').insert({
      category_id: otherCategoryId,
      section_id: sectionId,
      name: 'Wrong section',
    });

    expect(response.error?.code).toBe(FOREIGN_KEY_VIOLATION);
  });

  it('rejects a due_time without a due_date', async () => {
    const response = await user.client
      .from('tasks')
      .insert({ name: 'Time only', due_time: '09:00' });

    expect(response.error?.code).toBe(CHECK_VIOLATION);
  });

  it('keeps the task when its section is deleted', async () => {
    const temporarySectionId = await insertId(user.client, 'sections', {
      category_id: categoryId,
      name: 'Temporary',
    });
    const taskId = await insertId(user.client, 'tasks', {
      category_id: categoryId,
      section_id: temporarySectionId,
      name: 'Survivor',
    });

    await user.client.from('sections').delete().eq('id', temporarySectionId);
    const response = await user.client
      .from('tasks')
      .select('category_id, section_id')
      .eq('id', taskId)
      .single();

    expect(response.data).toEqual({
      category_id: categoryId,
      section_id: null,
    });
  });
});

describe('Public sign up', () => {
  it('is rejected by the server', async () => {
    const anonymousClient = createAnonymousClient();

    const response = await anonymousClient.auth.signUp({
      email: 'stranger@example.test',
      password: 'a-long-enough-password',
    });

    expect(response.error?.code).toBe('signup_disabled');
    expect(response.data.user).toBeNull();
  });
});

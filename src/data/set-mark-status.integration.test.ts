import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  createAdminClient,
  createTestUser,
  deleteTestUser,
  waitForLocalSchema,
  type TestUser,
} from './supabase/local-supabase';
import { supabase } from './supabase/client';
import { restoreMarkStatus, setMarkStatus } from './set-mark-status';

// Solo sustituye el almacenamiento nativo; las consultas usan Supabase local real.
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

let adminClient: SupabaseClient;
let user: TestUser;
let otherUser: TestUser;
let habitId: string;
let otherHabitId: string;
let otherTaskId: string;

async function insertHabit(client: SupabaseClient): Promise<string> {
  const response = await client
    .from('habits')
    .insert({ name: 'Habit', start_date: '2026-01-01' })
    .select('id')
    .single();
  if (response.error) {
    throw response.error;
  }
  return response.data.id;
}

async function insertTask(
  client: SupabaseClient,
  dueDate: string | null,
): Promise<string> {
  const response = await client
    .from('tasks')
    .insert({ name: 'Task', due_date: dueDate })
    .select('id')
    .single();
  if (response.error) {
    throw response.error;
  }
  return response.data.id;
}

async function readMark(date: string) {
  const response = await user.client
    .from('habit_marks')
    .select('status, marked_at')
    .eq('habit_id', habitId)
    .eq('occurrence_date', date);
  if (response.error) {
    throw response.error;
  }
  return response.data;
}

async function readTask(taskId: string) {
  const response = await user.client
    .from('tasks')
    .select('status, marked_at')
    .eq('id', taskId)
    .single();
  if (response.error) {
    throw response.error;
  }
  return response.data;
}

beforeAll(async () => {
  await waitForLocalSchema();
  adminClient = createAdminClient();
  user = await createTestUser(adminClient);
  otherUser = await createTestUser(adminClient);
  const session = await user.client.auth.getSession();
  if (!session.data.session) {
    throw new Error('Test user must have a session');
  }
  const authentication = await supabase.auth.setSession(session.data.session);
  expect(authentication.error).toBeNull();
  habitId = await insertHabit(user.client);
  otherHabitId = await insertHabit(otherUser.client);
  otherTaskId = await insertTask(otherUser.client, today);
}, 35000);

afterAll(async () => {
  await supabase.auth.signOut();
  if (user) {
    await deleteTestUser(adminClient, user);
  }
  if (otherUser) {
    await deleteTestUser(adminClient, otherUser);
  }
});

describe('setMarkStatus with occurrences', () => {
  it('corrects a two-week-old not-done occurrence and saves the correction instant', async () => {
    const date = '2026-09-23';
    const target = { kind: 'occurrence', habitId, date } as const;
    await setMarkStatus(target, 'not_done', today);
    const previousMark = await readMark(date);
    const beforeCorrection = Date.now();

    const result = await setMarkStatus(target, 'done', today);

    expect(result.ok).toBe(true);
    const correctedMark = await readMark(date);
    expect(correctedMark).toHaveLength(1);
    expect(correctedMark[0].status).toBe('done');
    expect(correctedMark[0].marked_at).not.toBe(previousMark[0].marked_at);
    const correctedInstant = new Date(correctedMark[0].marked_at).getTime();
    expect(correctedInstant).toBeGreaterThanOrEqual(beforeCorrection - 1000);
    expect(correctedInstant).toBeLessThanOrEqual(Date.now() + 1000);
  });

  it('creates a mark with the current UTC instant', async () => {
    const before = Date.now();
    const target = { kind: 'occurrence', habitId, date: today } as const;

    const result = await setMarkStatus(target, 'done', today);

    expect(result.ok).toBe(true);
    const marks = await readMark(today);
    expect(marks).toHaveLength(1);
    expect(marks[0].status).toBe('done');
    const markedAt = new Date(marks[0].marked_at).getTime();
    expect(markedAt).toBeGreaterThanOrEqual(before - 1000);
    expect(markedAt).toBeLessThanOrEqual(Date.now() + 1000);
    if (result.ok) {
      expect(result.value.markedAt).toMatch(/Z$/);
    }
  });

  it('changes an existing mark instead of duplicating it', async () => {
    const target = { kind: 'occurrence', habitId, date: today } as const;
    await setMarkStatus(target, 'done', today);

    const result = await setMarkStatus(target, 'not_done', today);

    expect(result.ok).toBe(true);
    const marks = await readMark(today);
    expect(marks).toHaveLength(1);
    expect(marks[0].status).toBe('not_done');
  });

  it('deletes the mark when going back to pending', async () => {
    const target = { kind: 'occurrence', habitId, date: today } as const;
    await setMarkStatus(target, 'done', today);

    const result = await setMarkStatus(target, 'pending', today);

    expect(result).toEqual({ ok: true, value: { markedAt: null } });
    expect(await readMark(today)).toHaveLength(0);
  });

  it('allows marking a past occurrence', async () => {
    const target = { kind: 'occurrence', habitId, date: '2026-10-01' } as const;

    const result = await setMarkStatus(target, 'not_done', today);

    expect(result.ok).toBe(true);
    expect(await readMark('2026-10-01')).toHaveLength(1);
  });

  it('rejects an occurrence of a later day', async () => {
    const target = { kind: 'occurrence', habitId, date: '2026-10-08' } as const;

    const result = await setMarkStatus(target, 'done', today);

    expect(result).toMatchObject({ ok: false, error: { code: 'future_date' } });
    expect(await readMark('2026-10-08')).toHaveLength(0);
  });

  it('rejects an invalid habit id', async () => {
    const target = {
      kind: 'occurrence',
      habitId: 'nope',
      date: today,
    } as const;

    const result = await setMarkStatus(target, 'done', today);

    expect(result).toMatchObject({
      ok: false,
      error: { code: 'invalid_input' },
    });
  });

  it("answers not_found for another user's habit", async () => {
    const target = {
      kind: 'occurrence',
      habitId: otherHabitId,
      date: today,
    } as const;

    const result = await setMarkStatus(target, 'done', today);

    expect(result).toMatchObject({ ok: false, error: { code: 'not_found' } });
  });
});

describe('setMarkStatus with tasks', () => {
  it('marks, changes and returns a task to pending', async () => {
    const taskId = await insertTask(user.client, null);
    const target = { kind: 'task', taskId } as const;

    await setMarkStatus(target, 'done', today);
    const done = await readTask(taskId);
    expect(done.status).toBe('done');
    expect(done.marked_at).not.toBeNull();

    await setMarkStatus(target, 'not_done', today);
    expect((await readTask(taskId)).status).toBe('not_done');

    await setMarkStatus(target, 'pending', today);
    expect(await readTask(taskId)).toEqual({
      status: 'pending',
      marked_at: null,
    });
  });

  it('allows marking a task whose date is in the future', async () => {
    const taskId = await insertTask(user.client, '2026-12-31');

    const result = await setMarkStatus({ kind: 'task', taskId }, 'done', today);

    expect(result.ok).toBe(true);
    expect((await readTask(taskId)).status).toBe('done');
  });

  it("answers not_found for another user's task and leaves it untouched", async () => {
    const result = await setMarkStatus(
      { kind: 'task', taskId: otherTaskId },
      'done',
      today,
    );

    expect(result).toMatchObject({ ok: false, error: { code: 'not_found' } });
    const task = await otherUser.client
      .from('tasks')
      .select('status')
      .eq('id', otherTaskId)
      .single();
    expect(task.data?.status).toBe('pending');
  });
});

it('answers not_found when deleting a mark belonging to another user', async () => {
  const result = await setMarkStatus(
    { kind: 'occurrence', habitId: otherHabitId, date: today },
    'pending',
    today,
  );
  expect(result).toMatchObject({ ok: false, error: { code: 'not_found' } });
});

it('rejects nonexistent calendar dates before writing', async () => {
  const result = await setMarkStatus(
    { kind: 'occurrence', habitId, date: '2026-02-30' },
    'done',
    today,
  );
  expect(result).toMatchObject({ ok: false, error: { code: 'invalid_input' } });
});

it('answers not_found when another user already marked the occurrence', async () => {
  const date = '2026-10-06';
  const originalMarkedAt = '2026-10-06T09:00:00.000Z';
  const otherHabitMarks = otherUser.client.from('habit_marks');
  const insertion = await otherHabitMarks.insert({
    habit_id: otherHabitId,
    occurrence_date: date,
    status: 'done',
    marked_at: originalMarkedAt,
  });
  expect(insertion.error).toBeNull();

  const result = await setMarkStatus(
    { kind: 'occurrence', habitId: otherHabitId, date },
    'not_done',
    today,
  );

  expect(result).toMatchObject({ ok: false, error: { code: 'not_found' } });
  const deletion = await setMarkStatus(
    { kind: 'occurrence', habitId: otherHabitId, date },
    'pending',
    today,
  );
  expect(deletion).toMatchObject({ ok: false, error: { code: 'not_found' } });
  const mark = await otherUser.client
    .from('habit_marks')
    .select('status, marked_at')
    .eq('habit_id', otherHabitId)
    .eq('occurrence_date', date)
    .single();
  expect(mark.data?.status).toBe('done');
  const storedInstant = new Date(mark.data?.marked_at).toISOString();
  expect(storedInstant).toBe(originalMarkedAt);
});

it('persists the old instant when undoing a task and an occurrence', async () => {
  const taskId = await insertTask(user.client, null);
  const oldInstant = '2026-10-06T09:00:00.000Z';
  const taskResult = await restoreMarkStatus(
    { kind: 'task', taskId },
    'not_done',
    today,
    oldInstant,
  );
  expect(taskResult).toEqual({ ok: true, value: { markedAt: oldInstant } });
  const task = await readTask(taskId);
  expect(task.status).toBe('not_done');
  const taskInstant = new Date(task.marked_at).toISOString();
  expect(taskInstant).toBe(oldInstant);

  const habitResult = await restoreMarkStatus(
    { kind: 'occurrence', habitId, date: today },
    'done',
    today,
    oldInstant,
  );
  expect(habitResult).toEqual({ ok: true, value: { markedAt: oldInstant } });
  const marks = await readMark(today);
  expect(marks[0].status).toBe('done');
  const habitInstant = new Date(marks[0].marked_at).toISOString();
  expect(habitInstant).toBe(oldInstant);
});

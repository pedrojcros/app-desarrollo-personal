import { afterAll, beforeAll, expect, it } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import { execFileSync } from 'node:child_process';

import {
  createAdminClient,
  createTestUser,
  deleteTestUser,
  waitForLocalSchema,
  type TestUser,
} from './supabase/local-supabase';

let adminClient: SupabaseClient;
let seedUser: TestUser;
let otherUser: TestUser;

beforeAll(async () => {
  await waitForLocalSchema();
  adminClient = createAdminClient();
  seedUser = await createTestUser(adminClient);
  otherUser = await createTestUser(adminClient);
}, 35000);

afterAll(async () => {
  if (seedUser) {
    await deleteTestUser(adminClient, seedUser);
  }
  if (otherUser) {
    await deleteTestUser(adminClient, otherUser);
  }
});

function seedRealistic() {
  try {
    return execFileSync('node', ['scripts/seed/seed-synthetic-year.mjs'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        SEED_TARGET: 'local',
        SEED_PROFILE: 'realistic',
        SEED_API_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
        SEED_USER_EMAIL: seedUser.email,
        SEED_USER_PASSWORD: seedUser.password,
        SEED_TODAY: '2026-10-10',
      },
    });
  } catch {
    throw new Error('Local realistic seed failed');
  }
}

async function readTaskNames(user: TestUser) {
  const result = await user.client.from('tasks').select('name').order('name');
  expect(result.error).toBeNull();
  return result.data;
}

it('reuses the seed user, replaces only its data and preserves another user', async () => {
  const protectedTask = await otherUser.client
    .from('tasks')
    .insert({ name: 'Keep this task' });
  expect(protectedTask.error).toBeNull();
  const output = seedRealistic();
  expect(output).not.toContain(seedUser.password);

  for (const [table, expectedCount] of [
    ['categories', 4],
    ['sections', 4],
    ['habits', 10],
    ['habit_rules', 10],
    ['habit_marks', 496],
    ['tasks', 30],
  ] as const) {
    const result = await adminClient
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', seedUser.id);
    expect(result.error).toBeNull();
    expect(result.count).toBe(expectedCount);
  }
  const originalNames = await readTaskNames(seedUser);
  const extraTask = await seedUser.client
    .from('tasks')
    .insert({ name: 'Remove on reseed' });
  expect(extraTask.error).toBeNull();

  seedRealistic();
  expect(await readTaskNames(seedUser)).toEqual(originalNames);
  expect(await readTaskNames(otherUser)).toEqual([{ name: 'Keep this task' }]);
}, 180000);

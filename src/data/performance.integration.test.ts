import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

import { addDays } from '../domain/calendar-date';
import { fetchHistory } from './history';
import { fetchPastPending } from './past-pending';
import { supabase } from './supabase/client';
import {
  createAdminClient,
  createAnonymousClient,
  waitForLocalSchema,
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

// RNF-01: Hoy tarda menos de 1 s en el móvil; la mitad es para la consulta.
const TODAY_BUDGET_MILLISECONDS = 500;
const LIST_BUDGET_MILLISECONDS = 1000;
const MEASURED_RUNS = 5;
const HISTORY_DAYS = 30;
const SEED_TIMEOUT_MILLISECONDS = 180_000;
const SEED_SCRIPT = 'scripts/seed/seed-synthetic-year.mjs';

const timeZone = 'Europe/Madrid';
const today = '2026-10-07';
const seedEmail = `performance-${randomUUID()}@example.test`;
const seedPassword = randomUUID();

let adminClient: SupabaseClient;
let seedUserId: string | undefined;

function runSeedScript(environment: Record<string, string>) {
  return execFileSync('node', [SEED_SCRIPT], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, ...environment },
  });
}

function calculateMedian(values: number[]): number {
  const sortedValues = [...values].sort((first, second) => first - second);
  const middleIndex = Math.floor(sortedValues.length / 2);
  return sortedValues[middleIndex];
}

// Una ejecución de calentamiento y después la mediana de las medidas.
async function measureMedianMilliseconds(
  operation: () => Promise<{ ok: boolean }>,
): Promise<number> {
  const warmUp = await operation();
  expect(warmUp.ok).toBe(true);
  const durations: number[] = [];
  for (let run = 0; run < MEASURED_RUNS; run += 1) {
    const startedAt = performance.now();
    const result = await operation();
    durations.push(performance.now() - startedAt);
    expect(result.ok).toBe(true);
  }
  return calculateMedian(durations);
}

async function signInAsSeedUser(): Promise<string> {
  const anonymousClient = createAnonymousClient();
  const signIn = await anonymousClient.auth.signInWithPassword({
    email: seedEmail,
    password: seedPassword,
  });
  if (signIn.error || !signIn.data.session) {
    throw new Error('The synthetic user could not sign in');
  }
  const authentication = await supabase.auth.setSession(signIn.data.session);
  expect(authentication.error).toBeNull();
  return signIn.data.user.id;
}

beforeAll(async () => {
  await waitForLocalSchema();
  adminClient = createAdminClient();
  runSeedScript({
    SEED_USER_EMAIL: seedEmail,
    SEED_USER_PASSWORD: seedPassword,
    SEED_TODAY: today,
  });
  seedUserId = await signInAsSeedUser();
}, SEED_TIMEOUT_MILLISECONDS);

afterAll(async () => {
  // Borrar el usuario borra en cascada todos sus datos.
  if (seedUserId) {
    await adminClient.auth.admin.deleteUser(seedUserId);
  }
});

describe('RNF-01 con un año de datos sintéticos', () => {
  it('shows Today in under half a second', async () => {
    const median = await measureMedianMilliseconds(() =>
      fetchTodayView(today, timeZone),
    );
    console.log(`fetchTodayView median: ${median.toFixed(0)} ms`);
    expect(median).toBeLessThan(TODAY_BUDGET_MILLISECONDS);
  });

  it('shows Pending in under one second', async () => {
    const median = await measureMedianMilliseconds(() =>
      fetchPastPending(today),
    );
    console.log(`fetchPastPending median: ${median.toFixed(0)} ms`);
    expect(median).toBeLessThan(LIST_BUDGET_MILLISECONDS);
  });

  it('loads 30 days of history in under one second', async () => {
    const fromDate = addDays(today, -(HISTORY_DAYS - 1));
    const median = await measureMedianMilliseconds(() =>
      fetchHistory(fromDate, today, timeZone),
    );
    console.log(`fetchHistory (30 days) median: ${median.toFixed(0)} ms`);
    expect(median).toBeLessThan(LIST_BUDGET_MILLISECONDS);
  });
});

describe('seed script safety', () => {
  it('refuses a non-local API URL without writing anything', () => {
    const unsafeEmail = `unsafe-${randomUUID()}@example.test`;
    let failureOutput = '';
    try {
      runSeedScript({
        SEED_API_URL: 'https://example.supabase.co',
        SEED_USER_EMAIL: unsafeEmail,
        SEED_USER_PASSWORD: seedPassword,
      });
    } catch (error) {
      failureOutput = String((error as { stderr?: string }).stderr);
    }
    expect(failureOutput).toContain('only a local Supabase is allowed');
  });
});

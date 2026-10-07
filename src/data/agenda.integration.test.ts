import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createAdminClient,
  createTestUser,
  deleteTestUser,
  waitForLocalSchema,
  type TestUser,
} from './supabase/local-supabase';
import { fetchHabits, fetchHabitMarks, mapTaskRow } from './agenda';
import { unwrapResult } from './result';
import { supabase } from './supabase/client';

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

let adminClient: SupabaseClient;
let user: TestUser;
let activeId: string;
let archivedBeforeId: string;
let archivedAfterId: string;

async function insertHabit(
  name: string,
  archivedAt: string | null,
): Promise<string> {
  const response = await user.client
    .from('habits')
    .insert({
      name,
      start_date: '2026-01-01',
      time_of_day: '08:30:00',
      duration_minutes: 15,
      archived_at: archivedAt,
    })
    .select('id')
    .single();
  if (response.error) {
    throw response.error;
  }
  return response.data.id;
}

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
  activeId = await insertHabit('Active', null);
  archivedBeforeId = await insertHabit(
    'Archived before midnight',
    '2026-10-06T21:59:59Z',
  );
  archivedAfterId = await insertHabit(
    'Archived after midnight',
    '2026-10-06T22:00:00Z',
  );
  const rules = await user.client.from('habit_rules').insert([
    { habit_id: activeId, valid_from: '2026-01-01', frequency: 'daily' },
    {
      habit_id: activeId,
      valid_from: '2026-10-01',
      frequency: 'weekdays',
      weekdays: [1, 7],
    },
    {
      habit_id: archivedBeforeId,
      valid_from: '2026-01-01',
      frequency: 'every_n_days',
      interval_days: 3,
    },
    {
      habit_id: archivedAfterId,
      valid_from: '2026-01-01',
      frequency: 'monthly',
    },
  ]);
  expect(rules.error).toBeNull();
  const marks = await user.client.from('habit_marks').insert([
    {
      habit_id: activeId,
      occurrence_date: '2026-10-05',
      status: 'done',
      marked_at: '2026-10-05T10:00:00Z',
    },
    {
      habit_id: activeId,
      occurrence_date: '2026-10-06',
      status: 'not_done',
      marked_at: '2026-10-06T10:00:00Z',
    },
    {
      habit_id: activeId,
      occurrence_date: '2026-10-07',
      status: 'done',
      marked_at: '2026-10-07T10:00:00Z',
    },
  ]);
  expect(marks.error).toBeNull();
}, 35000);

afterAll(async () => {
  await supabase.auth.signOut();
  if (user) {
    await deleteTestUser(adminClient, user);
  }
});

describe('Shared agenda reads', () => {
  it('loads active habits with all rule versions and normalized times', async () => {
    const habits = unwrapResult(
      await fetchHabits({ includeArchived: false, timeZone: 'Europe/Madrid' }),
    );
    expect(habits).toHaveLength(1);
    expect(habits[0]).toMatchObject({
      id: activeId,
      name: 'Active',
      timeOfDay: '08:30',
      timeSlot: null,
      durationMinutes: 15,
      archivedOn: null,
      categoryId: null,
      sectionId: null,
    });
    expect(habits[0].ruleVersions).toEqual(
      expect.arrayContaining([
        {
          validFrom: '2026-01-01',
          frequency: 'daily',
          weekdays: [],
          intervalDays: null,
        },
        {
          validFrom: '2026-10-01',
          frequency: 'weekdays',
          weekdays: [1, 7],
          intervalDays: null,
        },
      ]),
    );
  });
  it('includes archived habits and converts instants across Madrid midnight', async () => {
    const habits = unwrapResult(
      await fetchHabits({ includeArchived: true, timeZone: 'Europe/Madrid' }),
    );
    expect(habits).toHaveLength(3);
    expect(habits.find((habit) => habit.id === archivedBeforeId)).toMatchObject(
      {
        archivedOn: '2026-10-06',
        ruleVersions: [
          {
            frequency: 'every_n_days',
            intervalDays: 3,
            weekdays: [],
            validFrom: '2026-01-01',
          },
        ],
      },
    );
    expect(
      habits.find((habit) => habit.id === archivedAfterId)?.archivedOn,
    ).toBe('2026-10-07');
    const utcHabits = unwrapResult(
      await fetchHabits({ includeArchived: true, timeZone: 'UTC' }),
    );
    expect(
      utcHabits.find((habit) => habit.id === archivedAfterId)?.archivedOn,
    ).toBe('2026-10-06');
  });
  it('reads both range endpoints and excludes surrounding marks', async () => {
    const marks = unwrapResult(
      await fetchHabitMarks({ fromDate: '2026-10-05', toDate: '2026-10-06' }),
    );
    expect(marks).toEqual([
      {
        habitId: activeId,
        date: '2026-10-05',
        status: 'done',
        markedAt: '2026-10-05T10:00:00+00:00',
      },
      {
        habitId: activeId,
        date: '2026-10-06',
        status: 'not_done',
        markedAt: '2026-10-06T10:00:00+00:00',
      },
    ]);
    expect(
      unwrapResult(
        await fetchHabitMarks({ fromDate: '2026-10-09', toDate: '2026-10-08' }),
      ),
    ).toEqual([]);
  });
  it('reads more than the Supabase 1000-row limit without truncating history', async () => {
    const marks = Array.from({ length: 1100 }, (_value, index) => {
      const instant = new Date('2020-01-01T00:00:00Z');
      instant.setUTCDate(instant.getUTCDate() + index);
      return {
        habit_id: archivedBeforeId,
        occurrence_date: instant.toISOString().slice(0, 10),
        status: 'done',
      };
    });
    const inserted = await user.client.from('habit_marks').insert(marks);
    expect(inserted.error).toBeNull();
    const fetched = unwrapResult(
      await fetchHabitMarks({ fromDate: '2020-01-01', toDate: '2023-12-31' }),
    );
    expect(fetched).toHaveLength(1100);
    expect(fetched[0].date).toBe('2020-01-01');
    expect(fetched[1099].date).toBe('2023-01-04');
  });
  it('returns unknown_error for invalid database input and mapping failures', async () => {
    expect(
      await fetchHabitMarks({ fromDate: 'invalid', toDate: '2026-10-07' }),
    ).toMatchObject({ ok: false, error: { code: 'unknown_error' } });
    expect(
      await fetchHabits({ includeArchived: true, timeZone: 'Invalid/Zone' }),
    ).toMatchObject({ ok: false, error: { code: 'unknown_error' } });
  });
  it('returns network_error instead of throwing when the transport is unavailable', async () => {
    const transport = jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new TypeError('Network unavailable'));
    try {
      expect(
        await fetchHabits({
          includeArchived: false,
          timeZone: 'Europe/Madrid',
        }),
      ).toMatchObject({ ok: false, error: { code: 'network_error' } });
      expect(
        await fetchHabitMarks({ fromDate: '2026-10-05', toDate: '2026-10-06' }),
      ).toMatchObject({ ok: false, error: { code: 'network_error' } });
    } finally {
      transport.mockRestore();
    }
  }, 20000);
  it('maps actual task rows, preserving nulls and normalizing archive date', async () => {
    const response = await supabase
      .from('tasks')
      .insert({
        name: 'Task',
        notes: 'Notes',
        due_date: '2026-10-07',
        due_time: '12:45:00',
        status: 'done',
        marked_at: '2026-10-07T10:00:00Z',
        archived_at: '2026-10-06T22:00:00Z',
      })
      .select('*')
      .single();
    if (response.error) {
      throw response.error;
    }
    expect(mapTaskRow(response.data, 'Europe/Madrid')).toEqual({
      id: response.data.id,
      name: 'Task',
      notes: 'Notes',
      categoryId: null,
      sectionId: null,
      dueDate: '2026-10-07',
      dueTime: '12:45',
      status: 'done',
      markedAt: '2026-10-07T10:00:00+00:00',
      archivedOn: '2026-10-07',
    });
    const undated = await supabase
      .from('tasks')
      .insert({ name: 'Undated' })
      .select('*')
      .single();
    if (undated.error) {
      throw undated.error;
    }
    expect(mapTaskRow(undated.data, 'Europe/Madrid')).toMatchObject({
      dueDate: null,
      dueTime: null,
      markedAt: null,
      archivedOn: null,
      notes: null,
      status: 'pending',
    });
  });
});

import { afterAll, beforeAll, expect, it, jest } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createAdminClient,
  createTestUser,
  deleteTestUser,
  waitForLocalSchema,
  type TestUser,
} from './supabase/local-supabase';
import { supabase } from './supabase/client';
import { fetchReminderData } from './reminders-read';
import { unwrapResult } from './result';
import { planReminders } from '../domain/reminders';

jest.mock('./supabase/client', () => {
  const { createClient } = jest.requireActual<
    typeof import('@supabase/supabase-js')
  >('@supabase/supabase-js');
  return {
    supabase: createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL!,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    ),
  };
});
let adminClient: SupabaseClient;
let owner: TestUser;
let other: TestUser;
let timedHabitId: string;
beforeAll(async () => {
  await waitForLocalSchema();
  adminClient = createAdminClient();
  owner = await createTestUser(adminClient);
  other = await createTestUser(adminClient);
  const session = await owner.client.auth.getSession();
  await supabase.auth.setSession(session.data.session!);
  for (const user of [owner, other]) {
    const categories = await user.client
      .from('categories')
      .insert({ name: 'Category' })
      .select('id')
      .single();
    if (categories.error) {
      throw categories.error;
    }
    const tasks = await user.client.from('tasks').insert([
      {
        status: 'pending',
        name: 'Today',
        due_date: '2026-10-08',
        category_id: categories.data.id,
      },
      { status: 'pending', name: 'Last day', due_date: '2026-10-14' },
      {
        status: 'pending',
        name: 'After notification window',
        due_date: '2026-10-15',
      },
      { status: 'pending', name: 'Last deadline', due_date: '2026-10-21' },
      { status: 'pending', name: 'Too late', due_date: '2026-10-22' },
      { status: 'pending', name: 'Overdue', due_date: '2026-10-07' },
      { status: 'pending', name: 'Undated' },
      { name: 'Done', due_date: '2026-10-08', status: 'done' },
      {
        status: 'pending',
        name: 'Archived',
        due_date: '2026-10-08',
        archived_at: '2026-10-08T01:00:00Z',
      },
    ]);
    expect(tasks.error).toBeNull();
    const habits = await user.client
      .from('habits')
      .insert([
        {
          name: 'Timed',
          start_date: '2026-01-01',
          time_of_day: '08:00',
          duration_minutes: 15,
        },
        {
          name: 'Slot',
          start_date: '2026-01-01',
          time_slot: 'night',
          duration_minutes: 15,
        },
        { name: 'Anytime', start_date: '2026-01-01' },
        {
          name: 'Archived habit',
          start_date: '2026-01-01',
          time_of_day: '08:00',
          duration_minutes: 15,
          archived_at: '2026-10-08T01:00:00Z',
        },
      ])
      .select('id,name');
    if (habits.error) {
      throw habits.error;
    }
    const timed = habits.data.find((habit) => habit.name === 'Timed')!;
    if (user === owner) {
      timedHabitId = timed.id;
    }
    const rules = habits.data.map((habit) => ({
      habit_id: habit.id,
      valid_from: '2026-01-01',
      frequency: 'daily',
    }));
    expect(
      (await user.client.from('habit_rules').insert(rules)).error,
    ).toBeNull();
    const marks = ['2026-10-07', '2026-10-08', '2026-10-14', '2026-10-15'].map(
      (date) => ({ habit_id: timed.id, occurrence_date: date, status: 'done' }),
    );
    expect(
      (await user.client.from('habit_marks').insert(marks)).error,
    ).toBeNull();
  }
}, 35000);
afterAll(async () => {
  await supabase.auth.signOut();
  if (owner) {
    await deleteTestUser(adminClient, owner);
  }
  if (other) {
    await deleteTestUser(adminClient, other);
  }
});
it('reads full task lead coverage and the seven-day habit window through RLS', async () => {
  const data = unwrapResult(
    await fetchReminderData('2026-10-08', 'Europe/Madrid'),
  );
  const taskNames = data.tasks.map((task) => task.name);
  const habitNames = data.habits.map((habit) => habit.name);
  taskNames.sort();
  habitNames.sort();
  expect(taskNames).toEqual([
    'After notification window',
    'Last day',
    'Last deadline',
    'Today',
  ]);
  expect(habitNames).toEqual(['Slot', 'Timed']);
  expect(
    data.marks.map((mark) => ({ habitId: mark.habitId, date: mark.date })),
  ).toEqual([
    { habitId: timedHabitId, date: '2026-10-08' },
    { habitId: timedHabitId, date: '2026-10-14' },
  ]);
  expect([...data.categoryNames.values()]).toEqual(['Category']);
});
it('returns a failure for an invalid calendar date', async () => {
  expect(await fetchReminderData('invalid', 'Europe/Madrid')).toMatchObject({
    ok: false,
  });
});

it('plans a seven-day lead for a deadline outside the notice window, without extending that window', async () => {
  const data = unwrapResult(
    await fetchReminderData('2026-10-08', 'Europe/Madrid'),
  );
  const planned = planReminders({
    ...data,
    settings: { enabled: true, taskLeads: [7], habitTimeSlots: false },
    now: { date: '2026-10-08', time: '07:30' },
  });
  const taskReminders = planned.filter(
    (reminder) => reminder.channel === 'tasks',
  );
  const moments = taskReminders.map(
    (reminder) => `${reminder.date} ${reminder.time}`,
  );
  expect(moments).toEqual(['2026-10-08 09:00', '2026-10-14 09:00']);
});

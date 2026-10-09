import { describe, expect, it } from '@jest/globals';
import { execFileSync } from 'node:child_process';

function runModule(source: string) {
  return execFileSync('node', ['--input-type=module'], {
    encoding: 'utf8',
    input: source,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

function generateRealistic(today = '2026-10-10') {
  const source = `
    import { generateRealistic } from './scripts/seed/generate-realistic.mjs';
    console.log(JSON.stringify(generateRealistic({
      userId: '12345678-1234-4234-8234-123456789abc', today: '${today}', seed: 20261007
    })));
  `;
  return JSON.parse(runModule(source));
}

describe('realistic student data', () => {
  it('has four categories, sections and inbox items', () => {
    const data = generateRealistic();
    expect(data.categories).toHaveLength(4);
    expect(data.sections.length).toBeGreaterThanOrEqual(4);
    expect(
      data.tasks.some(
        (task: { category_id: string | null }) => task.category_id === null,
      ),
    ).toBe(true);
  });

  it('has ten habits with the requested active frequencies and swimming time', () => {
    const data = generateRealistic();
    expect(data.habits).toHaveLength(10);
    const activeHabits = data.habits.filter(
      (habit: { archived_at: string | null }) => habit.archived_at === null,
    );
    const activeIds = activeHabits.map((habit: { id: string }) => habit.id);
    const activeRules = data.habitRules.filter((rule: { habit_id: string }) =>
      activeIds.includes(rule.habit_id),
    );
    for (const [frequency, count] of [
      ['daily', 5],
      ['weekdays', 2],
      ['every_n_days', 1],
      ['monthly', 1],
    ]) {
      expect(
        activeRules.filter(
          (rule: { frequency: string }) => rule.frequency === frequency,
        ),
      ).toHaveLength(Number(count));
    }
    const swimming = data.habits.find(
      (habit: { name: string }) => habit.name === 'Nadar',
    );
    expect(swimming.time_of_day).toBe('17:00');
    expect(
      data.habitRules.find(
        (rule: { habit_id: string }) => rule.habit_id === swimming.id,
      ).weekdays,
    ).toEqual([3]);
    expect(
      activeHabits.some(
        (habit: { time_slot: string | null }) => habit.time_slot !== null,
      ),
    ).toBe(true);
  });

  it('has the requested task groups and two late completions', () => {
    const data = generateRealistic();
    const tasks = data.tasks;
    expect(tasks).toHaveLength(30);
    expect(
      tasks.filter(
        (task: { status: string; due_date: string }) =>
          task.status === 'pending' &&
          task.due_date !== null &&
          task.due_date < '2026-10-10',
      ),
    ).toHaveLength(5);
    expect(
      tasks.filter(
        (task: { due_date: string }) => task.due_date === '2026-10-10',
      ),
    ).toHaveLength(3);
    expect(
      tasks.filter(
        (task: { due_date: string }) =>
          task.due_date > '2026-10-10' && task.due_date <= '2026-10-31',
      ),
    ).toHaveLength(8);
    expect(
      tasks.filter(
        (task: { due_date: string | null }) => task.due_date === null,
      ),
    ).toHaveLength(6);
    const resolved = tasks.filter(
      (task: { status: string }) => task.status !== 'pending',
    );
    expect(resolved).toHaveLength(8);
    expect(
      resolved.some((task: { status: string }) => task.status === 'not_done'),
    ).toBe(true);
    expect(
      resolved.filter(
        (task: { status: string; marked_at: string; due_date: string }) =>
          task.status === 'done' && task.marked_at.slice(0, 10) > task.due_date,
      ),
    ).toHaveLength(2);
    expect(
      tasks.some(
        (task: { due_date: string; due_time: string | null }) =>
          task.due_date === '2026-10-10' && task.due_time !== null,
      ),
    ).toBe(true);
  });

  it('has ninety past days, approximate mark proportions and a current streak', () => {
    const data = generateRealistic();
    const marks = data.habitMarks;
    expect(
      data.habits.every(
        (habit: { start_date: string }) => habit.start_date === '2026-07-12',
      ),
    ).toBe(true);
    expect(
      marks.every(
        (mark: { occurrence_date: string }) =>
          mark.occurrence_date >= '2026-07-12' &&
          mark.occurrence_date <= '2026-10-09',
      ),
    ).toBe(true);
    for (const [status, minimum, maximum] of [
      ['done', 0.7, 0.8],
      ['not_done', 0.07, 0.13],
    ]) {
      const count = marks.filter(
        (mark: { status: string }) => mark.status === status,
      ).length;
      const ratio = count / data.occurrenceCount;
      expect(ratio).toBeGreaterThanOrEqual(Number(minimum));
      expect(ratio).toBeLessThanOrEqual(Number(maximum));
    }
    const unmarkedRatio = 1 - marks.length / data.occurrenceCount;
    expect(unmarkedRatio).toBeGreaterThanOrEqual(0.12);
    expect(unmarkedRatio).toBeLessThanOrEqual(0.18);
    const streakHabit = data.habits.find(
      (habit: { name: string }) => habit.name === 'Leer antes de dormir',
    );
    for (const date of [
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
      '2026-10-05',
      '2026-10-06',
      '2026-10-07',
      '2026-10-08',
      '2026-10-09',
    ]) {
      expect(
        marks.some(
          (mark: {
            habit_id: string;
            occurrence_date: string;
            status: string;
          }) =>
            mark.habit_id === streakHabit.id &&
            mark.occurrence_date === date &&
            mark.status === 'done',
        ),
      ).toBe(true);
    }
  });

  it('is deterministic for the same date and follows a different today', () => {
    expect(generateRealistic()).toEqual(generateRealistic());
    const nextDay = generateRealistic('2026-10-11');
    expect(nextDay.habits[0].start_date).toBe('2026-07-13');
  });
});

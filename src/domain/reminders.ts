import {
  addDays,
  daysBetween,
  getDayOfMonth,
  getIsoWeekday,
} from './calendar-date';
import type { Habit, HabitMark, Task } from './entities';
import {
  getHabitOccurrences,
  getOccurrenceStatus,
  indexMarks,
  type MarkIndex,
} from './habit-occurrences';
import type {
  PlannedReminder,
  ReminderLead,
  ReminderSettings,
} from './reminder-types';
import type { CalendarDate } from './types';

export * from './reminder-types';

interface PlanningInput {
  tasks: Task[];
  habits: Habit[];
  marks: HabitMark[];
  categoryNames: ReadonlyMap<string, string>;
  now: { date: CalendarDate; time: string };
  settings: ReminderSettings;
}

const WEEKDAY_NAMES = [
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
  'domingo',
];

export function planReminders(input: PlanningInput): PlannedReminder[] {
  if (!input.settings.enabled) {
    return [];
  }

  const lastDate = addDays(input.now.date, 6);
  const markIndex = indexMarks(input.marks);
  const candidates: PlannedReminder[] = [];
  for (const task of input.tasks) {
    candidates.push(...planTaskReminders(task, input));
  }
  for (const habit of input.habits) {
    candidates.push(...planHabitReminders(habit, input, lastDate, markIndex));
  }

  const inWindow = candidates.filter((reminder) => {
    if (reminder.date < input.now.date || reminder.date > lastDate) {
      return false;
    }
    return reminder.date !== input.now.date || reminder.time >= input.now.time;
  });
  inWindow.sort(compareReminders);
  return inWindow.slice(0, 64);
}

function planTaskReminders(
  task: Task,
  input: PlanningInput,
): PlannedReminder[] {
  if (
    task.archivedOn !== null ||
    task.status !== 'pending' ||
    task.dueDate === null
  ) {
    return [];
  }
  if (task.dueDate < input.now.date) {
    return [];
  }

  const reminders: PlannedReminder[] = [];
  const leads = new Set(input.settings.taskLeads);
  for (const lead of leads) {
    const moment = getTaskReminderMoment(task.dueDate, task.dueTime, lead);
    const relativeDays = daysBetween(moment.date, task.dueDate);
    let text = getTaskReminderText(task.dueDate, relativeDays);
    if (lead === 0 && task.dueTime !== null) {
      text = `${text} a las ${task.dueTime}`;
    }
    const body = addCategory(text, task.categoryId, input.categoryNames);
    const fingerprint = contentFingerprint(task.name, body, moment.time);
    reminders.push({
      key: `task:${task.id}:${task.dueDate}:${lead}:${fingerprint}`,
      ...moment,
      title: task.name,
      body,
      channel: 'tasks',
      target: { kind: 'task', taskId: task.id },
    });
  }
  return reminders;
}

function getTaskReminderMoment(
  date: CalendarDate,
  time: string | null,
  lead: ReminderLead,
): { date: CalendarDate; time: string } {
  if (lead !== 0 || time === null) {
    return { date: addDays(date, -lead), time: '09:00' };
  }

  const [hourText, minuteText] = time.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);
  let reminderMinutes = hour * 60 + minute - 60;
  let reminderDate = date;
  if (reminderMinutes < 0) {
    reminderDate = addDays(date, -1);
    reminderMinutes += 24 * 60;
  }
  const reminderHour = Math.floor(reminderMinutes / 60);
  const reminderMinute = reminderMinutes % 60;
  const hourString = String(reminderHour);
  const paddedHour = hourString.padStart(2, '0');
  const minuteString = String(reminderMinute);
  const paddedMinute = minuteString.padStart(2, '0');
  return { date: reminderDate, time: `${paddedHour}:${paddedMinute}` };
}

function getTaskReminderText(dueDate: CalendarDate, lead: number): string {
  if (lead === 0) {
    return 'Hoy';
  }
  if (lead === 1) {
    return 'Mañana';
  }
  const weekday = getIsoWeekday(dueDate);
  const weekdayName = WEEKDAY_NAMES[weekday - 1];
  const day = getDayOfMonth(dueDate);
  return `En ${lead} días, el ${weekdayName} ${day}`;
}

function planHabitReminders(
  habit: Habit,
  input: PlanningInput,
  lastDate: CalendarDate,
  marks: MarkIndex,
): PlannedReminder[] {
  if (habit.archivedOn !== null) {
    return [];
  }
  if (habit.timeOfDay === null && !input.settings.habitTimeSlots) {
    return [];
  }

  const occurrences = getHabitOccurrences(habit, input.now.date, lastDate);
  const reminders: PlannedReminder[] = [];
  for (const occurrence of occurrences) {
    if (occurrence.sortTime === null) {
      continue;
    }
    const state = getOccurrenceStatus(marks, habit.id, occurrence.date);
    if (state.status !== 'pending') {
      continue;
    }
    const text = `Ahora, a las ${occurrence.sortTime}`;
    const body = addCategory(text, habit.categoryId, input.categoryNames);
    const fingerprint = contentFingerprint(
      habit.name,
      body,
      occurrence.sortTime,
    );
    reminders.push({
      key: `habit:${habit.id}:${occurrence.date}:${fingerprint}`,
      date: occurrence.date,
      time: occurrence.sortTime,
      title: habit.name,
      body,
      channel: 'habits',
      target: { kind: 'habit', habitId: habit.id, date: occurrence.date },
    });
  }
  return reminders;
}

function addCategory(
  text: string,
  categoryId: string | null,
  categoryNames: ReadonlyMap<string, string>,
): string {
  if (categoryId === null) {
    return text;
  }
  const categoryName = categoryNames.get(categoryId);
  if (categoryName === undefined || categoryName === '') {
    return text;
  }
  return `${categoryName} · ${text}`;
}

function contentFingerprint(title: string, body: string, time: string): string {
  // FNV-1a identifica cambios de contenido sin dependencias ni instantes UTC.
  const content = JSON.stringify([title, body, time]);
  let hash = 2166136261;
  for (let index = 0; index < content.length; index += 1) {
    hash ^= content.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const unsignedHash = hash >>> 0;
  const hexadecimalHash = unsignedHash.toString(16);
  return hexadecimalHash.padStart(8, '0');
}

function compareReminders(
  first: PlannedReminder,
  second: PlannedReminder,
): number {
  const firstMoment = `${first.date}T${first.time}`;
  const secondMoment = `${second.date}T${second.time}`;
  if (firstMoment !== secondMoment) {
    return firstMoment < secondMoment ? -1 : 1;
  }
  if (first.key === second.key) {
    return 0;
  }
  return first.key < second.key ? -1 : 1;
}

export function diffReminders(
  planned: PlannedReminder[],
  scheduledKeys: string[],
): { toCancel: string[]; toSchedule: PlannedReminder[] } {
  const plannedKeys = new Set(planned.map((reminder) => reminder.key));
  const scheduled = new Set(scheduledKeys);
  const toCancel = scheduledKeys.filter((key) => !plannedKeys.has(key));
  const toSchedule = planned.filter((reminder) => !scheduled.has(reminder.key));
  return { toCancel, toSchedule };
}

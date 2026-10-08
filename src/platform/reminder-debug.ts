import * as Notifications from 'expo-notifications';

import { fail, succeed, type DataResult } from '../data/result';

import { prepareReminderChannels } from './notifications';

export interface ScheduledReminderSummary {
  key: string;
  date: string;
  time: string;
  title: string;
}

const TEST_REMINDER_DELAY_SECONDS = 10;

function formatTwoDigits(value: number): string {
  const text = String(value);
  return text.padStart(2, '0');
}

function readTriggerInstant(
  trigger: Notifications.NotificationTrigger | null,
): Date | null {
  if (typeof trigger !== 'object' || trigger === null) {
    return null;
  }
  if (!('value' in trigger) || typeof trigger.value !== 'number') {
    return null;
  }
  return new Date(trigger.value);
}

function summarizeScheduledNotification(
  notification: Notifications.NotificationRequest,
): ScheduledReminderSummary {
  const instant = readTriggerInstant(notification.trigger);
  let date = 'sin fecha';
  let time = '--:--';
  if (instant !== null) {
    const month = formatTwoDigits(instant.getMonth() + 1);
    const day = formatTwoDigits(instant.getDate());
    const hour = formatTwoDigits(instant.getHours());
    const minute = formatTwoDigits(instant.getMinutes());
    date = `${instant.getFullYear()}-${month}-${day}`;
    time = `${hour}:${minute}`;
  }
  return {
    key: notification.identifier,
    date,
    time,
    title: notification.content.title ?? '',
  };
}

/** Lo que el móvil tiene programado, para la pantalla de desarrollo. */
export async function listScheduledReminders(): Promise<
  ScheduledReminderSummary[]
> {
  const notifications = await Notifications.getAllScheduledNotificationsAsync();
  const summaries = notifications.map(summarizeScheduledNotification);
  return summaries.sort((first, second) => first.key.localeCompare(second.key));
}

/** Programa un aviso suelto con la clave `test:<instante>`, 10 segundos adelante. */
export async function scheduleTestReminder(): Promise<DataResult<string>> {
  const now = Date.now();
  const key = `test:${now}`;
  const triggerDate = new Date(now + TEST_REMINDER_DELAY_SECONDS * 1000);

  try {
    await prepareReminderChannels();
    await Notifications.scheduleNotificationAsync({
      identifier: key,
      content: { title: 'Aviso de prueba', body: 'Han pasado 10 segundos.' },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: 'tasks',
      },
    });
  } catch (error) {
    let message = 'Failed to schedule the test reminder.';
    if (error instanceof Error) {
      message = error.message;
    }
    return fail('TEST_REMINDER_FAILED', message);
  }

  return succeed(key);
}

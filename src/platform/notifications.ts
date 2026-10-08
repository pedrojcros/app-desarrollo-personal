import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { fail, succeed, type DataResult } from '../data/result';
import type { PlannedReminder } from '../domain/reminder-types';

export type ReminderPermission =
  'granted' | 'denied' | 'undetermined' | 'unsupported';

export function isReminderPlatformSupported(): boolean {
  return Platform.OS !== 'web';
}

export async function prepareReminderChannels(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync('tasks', {
    name: 'Tareas',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  await Notifications.setNotificationChannelAsync('habits', {
    name: 'Hábitos',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function getReminderPermission(): Promise<ReminderPermission> {
  if (!isReminderPlatformSupported()) {
    return 'unsupported';
  }

  const permissionStatus = await Notifications.getPermissionsAsync();
  return getReminderPermissionFromStatus(permissionStatus);
}

export async function requestReminderPermission(): Promise<ReminderPermission> {
  if (!isReminderPlatformSupported()) {
    return 'unsupported';
  }

  await prepareReminderChannels();
  const permissionStatus = await Notifications.requestPermissionsAsync();
  return getReminderPermissionFromStatus(permissionStatus);
}

export async function getScheduledReminderKeys(): Promise<string[]> {
  const scheduledNotifications =
    await Notifications.getAllScheduledNotificationsAsync();
  const scheduledKeys = scheduledNotifications.map(
    (notification) => notification.identifier,
  );
  return scheduledKeys;
}

export async function scheduleReminder(
  reminder: PlannedReminder,
): Promise<DataResult<void>> {
  const triggerDate = getReminderDate(reminder);

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: reminder.key,
      content: {
        title: reminder.title,
        body: reminder.body,
        data: { target: reminder.target },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: reminder.channel,
      },
    });
  } catch (error) {
    let message = 'Failed to schedule reminder.';
    if (error instanceof Error) {
      message = error.message;
    }
    return fail('SCHEDULE_FAILED', message);
  }

  return succeed(undefined);
}

export async function cancelReminders(keys: string[]): Promise<void> {
  for (const key of keys) {
    await Notifications.cancelScheduledNotificationAsync(key);
  }
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export function addReminderTapListener(
  onTap: (target: PlannedReminder['target']) => void,
): () => void {
  let active = true;
  const handledResponses = new Set<string>();

  function handleResponse(response: Notifications.NotificationResponse): void {
    if (!active) {
      return;
    }
    const request = response.notification.request;
    const responseId = JSON.stringify([
      request.identifier,
      response.notification.date,
      response.actionIdentifier,
    ]);
    if (handledResponses.has(responseId)) {
      return;
    }
    const target = request.content.data?.target;
    if (!isReminderTarget(target)) {
      return;
    }
    handledResponses.add(responseId);
    // Al consumir el toque se evita abrirlo otra vez al montar una sesión nueva.
    void Notifications.clearLastNotificationResponseAsync().catch(
      () => undefined,
    );
    onTap(target);
  }

  const subscription =
    Notifications.addNotificationResponseReceivedListener(handleResponse);
  // El listener por sí solo pierde el toque que arrancó la aplicación cerrada.
  void Notifications.getLastNotificationResponseAsync()
    .then((response) => {
      if (response !== null) {
        handleResponse(response);
      }
    })
    .catch(() => undefined);

  return () => {
    active = false;
    subscription.remove();
  };
}

function getReminderPermissionFromStatus(
  permissionStatus: Notifications.NotificationPermissionsStatus,
): ReminderPermission {
  if (permissionStatus.granted) {
    return 'granted';
  }
  if (permissionStatus.status === 'denied') {
    return 'denied';
  }
  return 'undetermined';
}

function getReminderDate(reminder: PlannedReminder): Date {
  const [yearValue, monthValue, dayValue] = reminder.date.split('-');
  const [hourValue, minuteValue] = reminder.time.split(':');
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const hour = Number(hourValue);
  const minute = Number(minuteValue);

  return new Date(year, month - 1, day, hour, minute);
}

function isReminderTarget(value: unknown): value is PlannedReminder['target'] {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  if (!('kind' in value)) {
    return false;
  }

  if (value.kind === 'task') {
    return 'taskId' in value && typeof value.taskId === 'string';
  }

  if (value.kind === 'habit') {
    return (
      'habitId' in value &&
      typeof value.habitId === 'string' &&
      'date' in value &&
      typeof value.date === 'string'
    );
  }

  return false;
}

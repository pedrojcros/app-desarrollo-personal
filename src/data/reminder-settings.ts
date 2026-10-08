import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

import {
  DEFAULT_REMINDER_SETTINGS,
  type ReminderSettings,
} from '../domain/reminder-types';
import { fail, succeed, type DataResult } from './result';

const storageKey = 'reminder-settings';

const reminderSettingsSchema = z.object({
  enabled: z.boolean(),
  taskLeads: z.array(
    z.union([z.literal(7), z.literal(3), z.literal(1), z.literal(0)]),
  ),
  habitTimeSlots: z.boolean(),
});

export async function loadReminderSettings(): Promise<ReminderSettings> {
  try {
    const storedValue = await AsyncStorage.getItem(storageKey);
    if (storedValue === null) {
      return DEFAULT_REMINDER_SETTINGS;
    }

    const parsedValue: unknown = JSON.parse(storedValue);
    const validationResult = reminderSettingsSchema.safeParse(parsedValue);
    if (validationResult.success) {
      return validationResult.data;
    }
  } catch {
    // Un fallo de lectura o un valor antiguo no debe impedir arrancar la app.
  }

  return DEFAULT_REMINDER_SETTINGS;
}

export async function saveReminderSettings(
  settings: ReminderSettings,
): Promise<DataResult<void>> {
  const validationResult = reminderSettingsSchema.safeParse(settings);
  if (!validationResult.success) {
    return fail('INVALID_REMINDER_SETTINGS', 'Reminder settings are invalid.');
  }

  try {
    const serializedSettings = JSON.stringify(validationResult.data);
    await AsyncStorage.setItem(storageKey, serializedSettings);
  } catch {
    return fail('STORAGE_ERROR', 'Failed to save reminder settings.');
  }

  return succeed(undefined);
}

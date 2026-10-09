import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, it } from '@jest/globals';

import {
  DEFAULT_REMINDER_SETTINGS,
  type ReminderSettings,
} from '../domain/reminder-types';
import {
  loadReminderSettings,
  saveReminderSettings,
} from './reminder-settings';

describe('reminder settings storage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns the default settings when nothing has been saved', async () => {
    const settings = await loadReminderSettings();

    expect(settings).toEqual(DEFAULT_REMINDER_SETTINGS);
  });

  it('saves settings and loads them again', async () => {
    const settings: ReminderSettings = {
      enabled: false,
      taskLeads: [7, 1],
      habitTimeSlots: true,
    };

    const saveResult = await saveReminderSettings(settings);

    expect(saveResult).toEqual({ ok: true, value: undefined });
    await expect(loadReminderSettings()).resolves.toEqual(settings);
  });

  it('returns defaults when saved settings are corrupt', async () => {
    await AsyncStorage.setItem('reminder-settings', '{invalid');

    const settings = await loadReminderSettings();

    expect(settings).toEqual(DEFAULT_REMINDER_SETTINGS);
  });
});

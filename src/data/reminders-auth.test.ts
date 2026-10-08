import { beforeEach, expect, it, jest } from '@jest/globals';
import { signOut } from './auth/auth';
import {
  cancelAllReminders,
  isReminderPlatformSupported,
} from '../platform/notifications';

jest.mock('./supabase/client', () => ({
  supabase: { auth: { signOut: jest.fn(async () => ({ error: null })) } },
}));
jest.mock('../platform/notifications');
jest.mock('expo-notifications', () => ({ setNotificationHandler: jest.fn() }));
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(isReminderPlatformSupported).mockReturnValue(true);
});
it('removes device reminders after signing out', async () => {
  expect(await signOut()).toEqual({ ok: true, value: null });
  expect(cancelAllReminders).toHaveBeenCalledTimes(1);
});

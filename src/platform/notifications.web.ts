import { succeed, type DataResult } from '../data/result';
import type { PlannedReminder } from '../domain/reminder-types';

export type ReminderPermission =
  'granted' | 'denied' | 'undetermined' | 'unsupported';

export function isReminderPlatformSupported(): boolean {
  return false;
}

export function configureReminderPresentation(): void {
  return;
}

export async function prepareReminderChannels(): Promise<void> {
  return;
}

export async function getReminderPermission(): Promise<ReminderPermission> {
  return 'unsupported';
}

export async function requestReminderPermission(): Promise<ReminderPermission> {
  return 'unsupported';
}

export async function getScheduledReminderKeys(): Promise<string[]> {
  return [];
}

export async function scheduleReminder(
  _reminder: PlannedReminder,
): Promise<DataResult<void>> {
  return succeed(undefined);
}

export async function cancelReminders(_keys: string[]): Promise<void> {
  return;
}

export async function cancelAllReminders(): Promise<void> {
  return;
}

export function addReminderTapListener(
  _onTap: (target: PlannedReminder['target']) => void,
): () => void {
  return () => undefined;
}

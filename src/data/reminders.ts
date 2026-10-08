import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { getCalendarDateInTimeZone } from '../domain/calendar-date';
import {
  diffReminders,
  planReminders,
  type ReminderSettings,
  type PlannedReminder,
} from '../domain/reminders';
import {
  cancelAllReminders,
  cancelReminders,
  getReminderPermission,
  getScheduledReminderKeys,
  isReminderPlatformSupported,
  prepareReminderChannels,
  scheduleReminder,
} from '../platform/notifications';
import { loadReminderSettings } from './reminder-settings';
import { fetchReminderData } from './reminders-read';
import { fail, succeed, type DataResult } from './result';
import { getDeviceTimeZone } from './time-zone';
import { useToday } from './use-today';

// R3 publicará esta misma clave; mientras no esté en develop se comparte el valor.
const reminderSettingsQueryKey = ['reminder-settings'] as const;

interface SyncOptions {
  settings?: ReminderSettings;
  signal?: AbortSignal;
}
let syncQueue: Promise<void> = Promise.resolve();
let cancellationVersion = 0;

/** La cola también serializa llamadas ajenas al hook, incluido cerrar sesión. */
export function syncReminders(
  options: SyncOptions = {},
): Promise<DataResult<void>> {
  const version = cancellationVersion;
  const operation = syncQueue.then(() => performSync(options, version));
  syncQueue = operation.then(() => undefined);
  return operation;
}

function isCancelled(options: SyncOptions, version: number): boolean {
  return options.signal?.aborted === true || version !== cancellationVersion;
}

function getLocalTime(instant: Date): string {
  const hourNumber = instant.getHours();
  const minuteNumber = instant.getMinutes();
  const hourText = String(hourNumber);
  const minuteText = String(minuteNumber);
  const hour = hourText.padStart(2, '0');
  const minute = minuteText.padStart(2, '0');
  return `${hour}:${minute}`;
}

function isFutureReminder(reminder: PlannedReminder): boolean {
  const instant = new Date();
  const timeZone = getDeviceTimeZone();
  const date = getCalendarDateInTimeZone(instant, timeZone);
  if (reminder.date !== date) {
    return reminder.date > date;
  }
  const time = getLocalTime(instant);
  if (reminder.time !== time) {
    return reminder.time > time;
  }
  // El dominio expresa minutos; el adaptador nativo dispara al segundo cero.
  return instant.getSeconds() === 0 && instant.getMilliseconds() === 0;
}

async function readReminderPlan(
  settings: ReminderSettings,
): Promise<DataResult<PlannedReminder[]>> {
  const timeZone = getDeviceTimeZone();
  const readingInstant = new Date();
  const readingDate = getCalendarDateInTimeZone(readingInstant, timeZone);
  const data = await fetchReminderData(readingDate, timeZone);
  if (!data.ok) {
    return data;
  }
  // Se vuelve a tomar la hora tras la red para no programar momentos ya pasados.
  const instant = new Date();
  const date = getCalendarDateInTimeZone(instant, timeZone);
  if (date !== readingDate) {
    return fail(
      'DAY_CHANGED',
      'The local day changed while reading reminders.',
    );
  }
  const time = getLocalTime(instant);
  const planned = planReminders({
    ...data.value,
    settings,
    now: { date, time },
  });
  return succeed(planned);
}

async function performSync(
  options: SyncOptions,
  version: number,
): Promise<DataResult<void>> {
  try {
    if (!isReminderPlatformSupported() || isCancelled(options, version)) {
      return succeed(undefined);
    }
    const settings = options.settings ?? (await loadReminderSettings());
    if (isCancelled(options, version)) {
      return succeed(undefined);
    }
    if (!settings.enabled) {
      await cancelAllReminders();
      return succeed(undefined);
    }
    const permission = await getReminderPermission();
    if (permission !== 'granted' || isCancelled(options, version)) {
      return succeed(undefined);
    }
    const plan = await readReminderPlan(settings);
    if (!plan.ok) {
      return plan;
    }
    if (isCancelled(options, version)) {
      return succeed(undefined);
    }
    const scheduledKeys = await getScheduledReminderKeys();
    const futureReminders = plan.value.filter(isFutureReminder);
    const changes = diffReminders(futureReminders, scheduledKeys);
    await prepareReminderChannels();
    if (isCancelled(options, version)) {
      return succeed(undefined);
    }
    await cancelReminders(changes.toCancel);
    for (const reminder of changes.toSchedule) {
      if (isCancelled(options, version)) {
        return succeed(undefined);
      }
      if (!isFutureReminder(reminder)) {
        continue;
      }
      const result = await scheduleReminder(reminder);
      if (!result.ok) {
        return result;
      }
    }
    return succeed(undefined);
  } catch {
    return fail(
      'REMINDER_SYNC_FAILED',
      'Could not synchronize device reminders.',
    );
  }
}

/** Una programación nativa en vuelo termina antes de la cancelación definitiva. */
export async function cancelReminderSync(): Promise<void> {
  cancellationVersion += 1;
  const cancellation = syncQueue.then(async () => {
    if (isReminderPlatformSupported()) {
      await cancelAllReminders();
    }
  });
  syncQueue = cancellation.catch(() => undefined);
  await cancellation;
}

function isSuccessfulMutation(data: unknown): boolean {
  if (typeof data === 'object' && data !== null && 'ok' in data) {
    return data.ok === true;
  }
  return true;
}

function configureReminderPresentation(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

function subscribeToReminderChanges(
  queryClient: QueryClient,
  request: () => void,
): () => void {
  let mutationTimer: ReturnType<typeof setTimeout> | undefined;
  const appState = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      request();
    }
  });
  const mutationCache = queryClient.getMutationCache();
  const unsubscribeMutations = mutationCache.subscribe((event) => {
    if (event.type !== 'updated' || event.action.type !== 'success') {
      return;
    }
    if (!isSuccessfulMutation(event.mutation.state.data)) {
      return;
    }
    clearTimeout(mutationTimer);
    mutationTimer = setTimeout(request, 2000);
  });
  const queryCache = queryClient.getQueryCache();
  const unsubscribeSettings = queryCache.subscribe((event) => {
    if (event.type !== 'updated' || event.action.type !== 'success') {
      return;
    }
    const key = event.query.queryKey;
    if (key.length === 1 && key[0] === reminderSettingsQueryKey[0]) {
      request();
    }
  });
  return () => {
    clearTimeout(mutationTimer);
    appState.remove();
    unsubscribeMutations();
    unsubscribeSettings();
  };
}

export function useReminderSync(hasSession: boolean): void {
  const queryClient = useQueryClient();
  const today = useToday();
  const previousDate = useRef(today);
  const requestSync = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!hasSession || !isReminderPlatformSupported()) {
      return;
    }
    configureReminderPresentation();
    const controller = new AbortController();
    let running = false;
    let pending = false;

    async function drainSyncRequests(): Promise<void> {
      running = true;
      do {
        pending = false;
        const settings = queryClient.getQueryData<ReminderSettings>(
          reminderSettingsQueryKey,
        );
        await syncReminders({ settings, signal: controller.signal });
      } while (pending && !controller.signal.aborted);
      running = false;
    }

    function request(): void {
      if (controller.signal.aborted) {
        return;
      }
      pending = true;
      if (!running) {
        void drainSyncRequests();
      }
    }
    requestSync.current = request;
    const unsubscribeChanges = subscribeToReminderChanges(queryClient, request);
    request();
    return () => {
      controller.abort();
      requestSync.current = null;
      unsubscribeChanges();
    };
  }, [hasSession, queryClient]);

  useEffect(() => {
    if (today === previousDate.current) {
      return;
    }
    previousDate.current = today;
    requestSync.current?.();
  }, [today]);
}

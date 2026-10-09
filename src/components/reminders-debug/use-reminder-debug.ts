import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { syncReminders } from '@/data/reminders';
import {
  getReminderPermission,
  isReminderPlatformSupported,
  type ReminderPermission,
} from '@/platform/notifications';
import {
  listScheduledReminders,
  scheduleTestReminder,
  type ScheduledReminderSummary,
} from '@/platform/reminder-debug';

type DeviceReminders = {
  permission: ReminderPermission;
  reminders: ScheduledReminderSummary[];
};

async function readDeviceReminders(): Promise<DeviceReminders> {
  const permission = await getReminderPermission();
  const reminders = await listScheduledReminders();
  return { permission, reminders };
}

// Estado y acciones de la pantalla de desarrollo de recordatorios.
export function useReminderDebug() {
  const isSupported = isReminderPlatformSupported();
  const [message, setMessage] = useState<string | null>(null);
  const deviceQuery = useQuery({
    queryKey: ['reminder-debug'],
    queryFn: readDeviceReminders,
    enabled: isSupported,
    // Lo programado cambia desde fuera de la pantalla: se lee siempre de nuevo.
    gcTime: 0,
  });
  const { refetch } = deviceQuery;

  async function syncNow() {
    const result = await syncReminders();
    if (result.ok) {
      setMessage('Puesto al día.');
    } else {
      setMessage(`No se pudo poner al día (${result.error.code}).`);
    }
    await refetch();
  }

  async function scheduleTest() {
    const result = await scheduleTestReminder();
    if (result.ok) {
      setMessage(`Aviso de prueba ${result.value} programado.`);
    } else {
      setMessage(`No se pudo programar la prueba (${result.error.code}).`);
    }
    await refetch();
  }

  return {
    isSupported,
    permission: deviceQuery.data?.permission ?? null,
    reminders: deviceQuery.data?.reminders ?? [],
    message,
    syncNow,
    scheduleTest,
  };
}

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import {
  getReminderPermission,
  requestReminderPermission,
} from '@/platform/notifications';

const permissionQueryKey = ['reminder-permission'] as const;

// Lee el permiso de avisos y lo vuelve a leer al volver a la app, por si el
// usuario lo ha cambiado en los ajustes del móvil.
export function useReminderPermission() {
  const queryClient = useQueryClient();
  const permissionQuery = useQuery({
    queryKey: permissionQueryKey,
    queryFn: getReminderPermission,
    staleTime: 0,
  });
  const { refetch } = permissionQuery;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (appState) => {
      if (appState === 'active') {
        refetch();
      }
    });
    return () => subscription.remove();
  }, [refetch]);

  async function askPermission() {
    const answeredPermission = await requestReminderPermission();
    queryClient.setQueryData(permissionQueryKey, answeredPermission);
  }

  return { permission: permissionQuery.data ?? null, askPermission };
}

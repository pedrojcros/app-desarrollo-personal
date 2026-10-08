import { router } from 'expo-router';
import { useEffect } from 'react';
import { addReminderTapListener } from '../platform/notifications';

export function useReminderNavigation(hasSession: boolean): void {
  useEffect(() => {
    if (!hasSession) {
      return;
    }
    return addReminderTapListener((target) => {
      if (target.kind === 'task') {
        router.push({
          pathname: '/tareas/[id]',
          params: { id: target.taskId },
        });
        return;
      }
      router.push('/hoy');
    });
  }, [hasSession]);
}

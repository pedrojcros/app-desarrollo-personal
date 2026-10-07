import { router } from 'expo-router';

export function returnAfterHabitSave(): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  // Una URL directa o una recarga puede no tener una pantalla anterior.
  router.replace('/(tabs)/hoy');
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupportedStorage } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Guía oficial de Supabase para Expo: AsyncStorage en el móvil y localStorage en
// la web. Al exportar la web se renderiza en el servidor, donde no hay ninguno.
export function selectSessionStorage(): SupportedStorage | undefined {
  if (Platform.OS !== 'web') {
    return AsyncStorage;
  }

  const isServerRendering = typeof window === 'undefined';
  if (isServerRendering) {
    return undefined;
  }

  return window.localStorage;
}

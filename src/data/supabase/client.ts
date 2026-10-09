import '../zod-config';

import { AppState, Platform } from 'react-native';

import { createAppSupabaseClient } from './create-client';
import { selectSessionStorage } from './session-storage';

// Se leen así, una a una, para que Expo las sustituya al compilar.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are required',
  );
}

export const supabase = createAppSupabaseClient({
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  storage: selectSessionStorage(),
});

// En el móvil el renovado de la sesión se pausa con la app en segundo plano
// (guía oficial de Supabase para React Native).
function refreshSessionOnlyWhileAppIsActive(): void {
  AppState.addEventListener('change', (appState) => {
    if (appState === 'active') {
      supabase.auth.startAutoRefresh();
      return;
    }
    supabase.auth.stopAutoRefresh();
  });
}

if (Platform.OS !== 'web') {
  refreshSessionOnlyWhileAppIsActive();
}

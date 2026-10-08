import { Redirect, Stack } from 'expo-router';
import { lazy, Suspense } from 'react';

import { useTheme } from '@/theme/theme-context';

// Igual que el catálogo: solo existe en desarrollo y no llega a la web publicada.
const RemindersDebugScreen = __DEV__
  ? lazy(() => import('@/components/reminders-debug/reminders-debug-screen'))
  : undefined;

export default function RemindersDebugRoute() {
  const { colors, fonts } = useTheme();

  if (RemindersDebugScreen === undefined) {
    return <Redirect href="/" />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Recordatorios (prueba)',
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTintColor: colors.foreground,
          headerTitleStyle: { fontFamily: fonts.heading },
        }}
      />
      <Suspense fallback={null}>
        <RemindersDebugScreen />
      </Suspense>
    </>
  );
}

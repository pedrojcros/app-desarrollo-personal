import { Redirect, Stack } from 'expo-router';
import { lazy, Suspense } from 'react';

import { useTheme } from '@/theme/theme-context';

// El catálogo solo existe en desarrollo. Metro sustituye `__DEV__` por `false`
// al exportar y elimina la rama, así que su código no llega a la web publicada.
const CatalogScreen = __DEV__
  ? lazy(() => import('@/components/catalog/catalog-screen'))
  : undefined;

export default function CatalogRoute() {
  const { colors, fonts } = useTheme();

  if (CatalogScreen === undefined) {
    return <Redirect href="/" />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Catálogo',
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTintColor: colors.foreground,
          headerTitleStyle: { fontFamily: fonts.heading },
        }}
      />
      <Suspense fallback={null}>
        <CatalogScreen />
      </Suspense>
    </>
  );
}

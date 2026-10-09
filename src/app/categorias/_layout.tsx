import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/data/auth';
import { useTheme } from '@/theme/theme-context';

export default function CategoryLayout() {
  const { session, isLoading } = useSession();
  const { colors, fonts } = useTheme();
  if (isLoading) {
    return null;
  }
  if (session === null) {
    return <Redirect href="/login" />;
  }
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerTitleStyle: { fontFamily: fonts.heading },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="[id]" options={{ title: 'Categoría' }} />
      </Stack>
    </>
  );
}

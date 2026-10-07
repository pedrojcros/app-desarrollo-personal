import { Redirect, Stack } from 'expo-router';
import { useSession } from '@/data/auth';
import { useTheme } from '@/theme/theme-context';

export default function HabitLayout() {
  const { session, isLoading } = useSession();
  const { colors, fonts } = useTheme();
  if (isLoading) {
    return null;
  }
  if (!session) {
    return <Redirect href="/login" />;
  }
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerTitleStyle: { fontFamily: fonts.semibold },
          contentStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="nuevo" options={{ title: 'Nuevo hábito' }} />
        <Stack.Screen name="[id]" options={{ title: 'Modificar hábito' }} />
      </Stack>
    </>
  );
}

import { Link, Stack } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { SignOutButton } from '@/components/sign-out-button';
import { SectionTitle } from '@/components/ui/section-title';
import { Text } from '@/components/ui/text';
import { ThemeSelector } from '@/components/ui/theme-selector';
import { useTheme } from '@/theme/theme-context';

export default function SettingsScreen() {
  const { colors, fonts } = useTheme();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Ajustes',
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTintColor: colors.foreground,
          headerTitleStyle: { fontFamily: fonts.heading },
        }}
      />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="px-5 pb-10"
      >
        <SectionTitle title="Tema" />
        <Text variant="eyebrow" className="mb-3 mt-2">
          Por defecto sigue al modo del móvil: claro, Blanco; oscuro, Negro.
        </Text>
        <ThemeSelector />
        <View className="mt-6">
          <SectionTitle title="Cuenta" />
          <View className="mt-3">
            <SignOutButton />
          </View>
        </View>
        {__DEV__ ? (
          <View className="mt-6">
            <SectionTitle title="Desarrollo" />
            <Link href="/catalog" className="min-h-11 pt-3">
              <Text weight="semibold" className="text-accent-text">
                Catálogo del sistema visual
              </Text>
            </Link>
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}

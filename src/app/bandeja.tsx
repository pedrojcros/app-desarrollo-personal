import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryViewScreen } from '@/components/category-view/category-view-screen';
import { QuickAddButton } from '@/components/quick-add';
import { useSession } from '@/data/auth';
import { useToday } from '@/data/use-today';
import { getQuickAddDefaults } from '@/domain/quick-add';
import { useTheme } from '@/theme/theme-context';

// Fuera de las pestañas, con la cabecera y la vuelta atrás de una categoría.
// Como no tiene carpeta con su propio layout, comprueba aquí la sesión.
export default function InboxScreen() {
  const { session, isLoading } = useSession();
  const { colors, fonts } = useTheme();
  const today = useToday();
  const insets = useSafeAreaInsets();
  const defaults = getQuickAddDefaults({ kind: 'other' }, today);

  if (isLoading) {
    return null;
  }
  if (session === null) {
    return <Redirect href="/login" />;
  }
  return (
    <View className="flex-1">
      <Stack.Screen
        options={{
          title: 'Bandeja',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerTitleStyle: { fontFamily: fonts.heading },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <CategoryViewScreen categoryId={null} />
      <View className="absolute right-4 mb-4" style={{ bottom: insets.bottom }}>
        <QuickAddButton defaults={defaults} />
      </View>
    </View>
  );
}

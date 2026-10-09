import { Link, Tabs, usePathname } from 'expo-router';
import {
  History,
  Inbox,
  LayoutGrid,
  Settings,
  Sun,
  Clock,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QuickAddButton } from '@/components/quick-add';
import { getQuickAddDefaults } from '@/domain/quick-add';
import { Icon } from '@/components/ui/icon';
import { TabIcon } from '@/components/ui/tab-icon';
import { usePastPendingCount } from '@/data/past-pending';
import { useToday } from '@/data/use-today';
import { useTheme } from '@/theme/theme-context';

// Alto de la barra del diseño (74), sin la zona segura de abajo.
const tabBarHeight = 74;

function SettingsButton() {
  return (
    <Link href="/ajustes" asChild>
      <Pressable
        role="link"
        accessibilityLabel="Ajustes"
        className="h-11 w-11 items-center justify-center"
      >
        <Icon icon={Settings} color="muted-foreground" size={22} />
      </Pressable>
    </Link>
  );
}

export default function TabsLayout() {
  const { colors, fonts, shape } = useTheme();
  const insets = useSafeAreaInsets();
  const today = useToday();
  const pendingCount = usePastPendingCount(today);
  const pathname = usePathname();
  const origin = pathname === '/hoy' ? 'today' : 'other';
  const defaults = getQuickAddDefaults({ kind: origin }, today);

  function tabIcon(icon: LucideIcon, badgeCount?: number) {
    return function renderTabIcon({ focused }: { focused: boolean }) {
      return <TabIcon icon={icon} focused={focused} badgeCount={badgeCount} />;
    };
  }

  return (
    <View className="flex-1">
      <Tabs
        initialRouteName="hoy"
        screenOptions={{
          headerRight: SettingsButton,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTintColor: colors.foreground,
          headerTitleStyle: { fontFamily: fonts.heading },
          tabBarActiveTintColor: colors['accent-text'],
          tabBarInactiveTintColor: colors['muted-foreground'],
          tabBarLabelStyle: {
            fontFamily: fonts.semibold,
            fontSize: 10,
            lineHeight: 12,
          },
          tabBarStyle: {
            backgroundColor: colors.surface,
            height: tabBarHeight + insets.bottom,
            paddingTop: 8,
            paddingBottom: 7 + insets.bottom,
            borderTopColor: colors.border,
            borderTopWidth: Math.max(shape.outlineWidth, 1),
          },
        }}
      >
        <Tabs.Screen
          name="hoy"
          options={{
            title: 'Hoy',
            // La pantalla ya trae su propio «Hoy» en grande.
            headerTitle: '',
            tabBarIcon: tabIcon(Sun),
          }}
        />
        <Tabs.Screen
          name="bandeja"
          options={{ title: 'Bandeja', tabBarIcon: tabIcon(Inbox) }}
        />
        <Tabs.Screen
          name="categorias"
          options={{ title: 'Categorías', tabBarIcon: tabIcon(LayoutGrid) }}
        />
        <Tabs.Screen
          name="pendientes"
          options={{
            title: 'Pendientes',
            tabBarIcon: tabIcon(Clock, pendingCount),
          }}
        />
        <Tabs.Screen
          name="historial"
          options={{ title: 'Historial', tabBarIcon: tabIcon(History) }}
        />
      </Tabs>
      <View
        className="absolute right-4 mb-4"
        style={{ bottom: tabBarHeight + insets.bottom }}
      >
        <QuickAddButton defaults={defaults} />
      </View>
    </View>
  );
}

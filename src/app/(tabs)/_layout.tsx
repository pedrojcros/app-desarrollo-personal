import { Link, Tabs } from 'expo-router';
import {
  History,
  Inbox,
  LayoutGrid,
  Settings,
  Sun,
  Clock,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { TabIcon } from '@/components/ui/tab-icon';
import { useTheme } from '@/theme/theme-context';

// T11 sustituirá esto por el número real de pendientes.
// Alto de la barra del diseño (74), sin la zona segura de abajo.
const tabBarHeight = 74;

function usePendingCount(): number {
  return 0;
}

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
  const pendingCount = usePendingCount();

  function tabIcon(icon: LucideIcon, badgeCount?: number) {
    return function renderTabIcon({ focused }: { focused: boolean }) {
      return <TabIcon icon={icon} focused={focused} badgeCount={badgeCount} />;
    };
  }

  return (
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
        options={{ title: 'Hoy', tabBarIcon: tabIcon(Sun) }}
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
  );
}

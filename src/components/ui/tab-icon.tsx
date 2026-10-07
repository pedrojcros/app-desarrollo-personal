import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { useTheme } from '@/theme/theme-context';

import { Icon } from './icon';
import { Text } from './text';

type TabIconProps = {
  icon: LucideIcon;
  focused: boolean;
  // Contador de la pestaña (Pendientes); 0 o ausente no dibuja nada.
  badgeCount?: number;
};

// El icono de una pestaña de la barra inferior, con la pastilla detrás si es
// la activa.
export function TabIcon({ icon, focused, badgeCount = 0 }: TabIconProps) {
  const { shape } = useTheme();
  const hasOutline = shape.outlineWidth > 0;
  const pillClassName = focused ? 'bg-accent-soft' : '';
  const pillBorderWidth = focused ? shape.outlineWidth : 0;
  const pillStyle = {
    borderRadius: shape.pillRadius,
    borderWidth: pillBorderWidth,
    boxShadow: focused ? shape.smallShadow : undefined,
  };
  const iconColor = focused ? 'accent-text' : 'muted-foreground';
  const badgeBorderWidth = hasOutline ? 1 : 0;

  return (
    <View
      className={`h-[30px] w-[52px] items-center justify-center border-border ${pillClassName}`}
      style={pillStyle}
    >
      <Icon icon={icon} color={iconColor} size={21} />
      {badgeCount > 0 ? (
        <View
          className="absolute -top-0.5 right-2 h-[15px] min-w-[15px] items-center justify-center rounded-full border-border bg-badge px-1"
          style={{ borderWidth: badgeBorderWidth }}
        >
          <Text
            variant="caption"
            weight="bold"
            className="text-[9px] leading-[13px] text-badge-foreground"
          >
            {badgeCount}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

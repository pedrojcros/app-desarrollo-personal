import type { LucideIcon } from 'lucide-react-native';

import { useTheme } from '@/theme/theme-context';
import type { ColorToken } from '@/theme/tokens';

type IconProps = {
  icon: LucideIcon;
  color?: ColorToken;
  size?: number;
  strokeWidth?: number;
};

// Los iconos de lucide piden un color real, no una clase: se saca del tema.
export function Icon({
  icon: LucideComponent,
  color = 'foreground',
  size = 20,
  strokeWidth = 2,
}: IconProps) {
  const { colors } = useTheme();

  return (
    <LucideComponent
      color={colors[color]}
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden
    />
  );
}

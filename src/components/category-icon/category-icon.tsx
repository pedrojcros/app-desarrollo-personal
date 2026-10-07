import {
  BookOpen,
  Briefcase,
  Car,
  Code,
  Dumbbell,
  Gamepad2,
  GraduationCap,
  HeartPulse,
  House,
  Inbox,
  Leaf,
  Music,
  Palette,
  PawPrint,
  Plane,
  ShoppingCart,
  Sparkles,
  Star,
  Users,
  Utensils,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';

import { Icon } from '@/components/ui/icon';
import type { CategoryColor } from '@/theme/category-colors';
import type { ColorToken } from '@/theme/tokens';

import type { CategoryIconName } from './category-icon-names';

// La Bandeja de entrada no es una categoría guardada, pero se pinta igual.
export type CategoryIconKey = CategoryIconName | 'inbox';

const lucideIcons: Record<CategoryIconKey, LucideIcon> = {
  star: Star,
  'shopping-cart': ShoppingCart,
  'graduation-cap': GraduationCap,
  'book-open': BookOpen,
  'heart-pulse': HeartPulse,
  dumbbell: Dumbbell,
  house: House,
  briefcase: Briefcase,
  wallet: Wallet,
  utensils: Utensils,
  plane: Plane,
  music: Music,
  palette: Palette,
  code: Code,
  leaf: Leaf,
  'paw-print': PawPrint,
  car: Car,
  users: Users,
  'gamepad-2': Gamepad2,
  sparkles: Sparkles,
  inbox: Inbox,
};

type CategoryIconProps = {
  name: CategoryIconKey;
  size?: number;
  colorToken?: ColorToken;
};

export function CategoryIcon({ name, size, colorToken }: CategoryIconProps) {
  return <Icon icon={lucideIcons[name]} size={size} color={colorToken} />;
}

/** Token de tema del color de una categoría, para iconos y puntos. */
export function getCategoryColorToken(color: CategoryColor): ColorToken {
  return `category-${color}`;
}

import type { CategoryColor } from '@/theme/tokens';

// Tailwind solo ve las clases escritas enteras, por eso no se construyen con
// plantillas de texto.
export const categoryBackgroundClasses: Record<CategoryColor, string> = {
  shopping: 'bg-category-shopping',
  university: 'bg-category-university',
  health: 'bg-category-health',
  personal: 'bg-category-personal',
  home: 'bg-category-home',
};

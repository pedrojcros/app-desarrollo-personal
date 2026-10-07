import type { CategoryColor } from '@/theme/category-colors';

// Tailwind solo ve las clases escritas enteras, por eso no se construyen con
// plantillas de texto.
export const categoryBackgroundClasses: Record<CategoryColor, string> = {
  teal: 'bg-category-teal',
  blue: 'bg-category-blue',
  green: 'bg-category-green',
  amber: 'bg-category-amber',
  garnet: 'bg-category-garnet',
};

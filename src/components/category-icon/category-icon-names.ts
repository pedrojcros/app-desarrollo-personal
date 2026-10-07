// Lista cerrada de iconos para categorías: la base de datos guarda el nombre.
// El orden es el de la rejilla de «Nueva categoría».
export const CATEGORY_ICON_NAMES = [
  'star',
  'shopping-cart',
  'graduation-cap',
  'book-open',
  'heart-pulse',
  'dumbbell',
  'house',
  'briefcase',
  'wallet',
  'utensils',
  'plane',
  'music',
  'palette',
  'code',
  'leaf',
  'paw-print',
  'car',
  'users',
  'gamepad-2',
  'sparkles',
] as const;

export type CategoryIconName = (typeof CATEGORY_ICON_NAMES)[number];

export const DEFAULT_CATEGORY_ICON_NAME: CategoryIconName = 'star';

export function isCategoryIconName(value: unknown): value is CategoryIconName {
  return CATEGORY_ICON_NAMES.some((iconName) => iconName === value);
}

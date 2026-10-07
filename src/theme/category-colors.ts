import { useTheme } from './theme-context';
import type { ColorToken } from './tokens';

// La base de datos guarda el nombre del color, nunca su valor: así cada tema
// puede pintarlo con su propio tono.
export const CATEGORY_COLORS = [
  'teal',
  'blue',
  'green',
  'amber',
  'garnet',
] as const;

export type CategoryColor = (typeof CATEGORY_COLORS)[number];

const categoryColorLabels: Record<CategoryColor, string> = {
  teal: 'Verde azulado',
  blue: 'Azul',
  green: 'Verde',
  amber: 'Ámbar',
  garnet: 'Granate',
};

/** Etiqueta en español para el selector de color. */
export function getCategoryColorLabel(color: CategoryColor): string {
  return categoryColorLabels[color];
}

/** Valor del color en el tema activo, para lo que no pueda usar una clase de NativeWind. */
export function useCategoryColorValue(color: CategoryColor): string {
  const { colors } = useTheme();
  const token = `category-${color}` as ColorToken;
  return colors[token];
}

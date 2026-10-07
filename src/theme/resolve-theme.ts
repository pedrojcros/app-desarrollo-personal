import type { ThemeName, ThemePreference } from './tokens';

type SystemColorScheme = 'light' | 'dark' | 'unspecified' | null | undefined;

// «Automático» sigue al modo del móvil: claro es Blanco, oscuro es Negro.
export function resolveTheme(
  preference: ThemePreference,
  systemColorScheme: SystemColorScheme,
): ThemeName {
  if (preference !== 'automatic') {
    return preference;
  }
  if (systemColorScheme === 'dark') {
    return 'black';
  }
  return 'white';
}

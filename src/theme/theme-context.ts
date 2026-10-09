import { createContext, useContext } from 'react';

import type {
  ThemeColors,
  ThemeFonts,
  ThemeName,
  ThemePreference,
  ThemeShape,
} from './tokens';

export type ThemeContextValue = {
  themeName: ThemeName;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  colors: ThemeColors;
  fonts: ThemeFonts;
  shape: ThemeShape;
};

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
);

export function useTheme(): ThemeContextValue {
  const themeContext = useContext(ThemeContext);
  if (themeContext === undefined) {
    throw new Error('useTheme must be used inside a ThemeProvider');
  }
  return themeContext;
}

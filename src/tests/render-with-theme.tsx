import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeContext } from '@/theme/theme-context';
import { themeColors, themeFonts, themeShapes } from '@/theme/tokens';

const whiteThemeContextValue = {
  themeName: 'white' as const,
  preference: 'white' as const,
  setPreference: () => {},
  colors: themeColors.white,
  fonts: themeFonts.white,
  shape: themeShapes.white,
};

// Los componentes del sistema visual leen el tema: en los tests se les da el Blanco.
export function renderWithTheme(element: ReactElement) {
  return render(
    <ThemeContext.Provider value={whiteThemeContextValue}>
      {element}
    </ThemeContext.Provider>,
  );
}

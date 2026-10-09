import { expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';

import { ThemeContext } from '@/theme/theme-context';
import { themeColors, themeFonts, themeShapes } from '@/theme/tokens';

import { TodayHeader } from './today-header';

const themeValue = {
  themeName: 'white' as const,
  preference: 'white' as const,
  setPreference: () => {},
  colors: themeColors.white,
  fonts: themeFonts.white,
  shape: themeShapes.white,
};

it('expone el título Hoy como encabezado', () => {
  render(
    <ThemeContext.Provider value={themeValue}>
      <TodayHeader
        date="2026-10-07"
        today="2026-10-07"
        total={0}
        marked={[]}
        onSelectDate={() => {}}
      />
    </ThemeContext.Provider>,
  );

  expect(screen.getByRole('header', { name: 'Hoy' })).toBeTruthy();
});

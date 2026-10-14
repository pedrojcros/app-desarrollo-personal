import { expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';

import type { ViewItem } from '@/domain/items';
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

function renderHeader(total: number, marked: ViewItem[]) {
  render(
    <ThemeContext.Provider value={themeValue}>
      <TodayHeader total={total} marked={marked} />
    </ThemeContext.Provider>,
  );
}

it('expone el título Hoy como encabezado', () => {
  renderHeader(0, []);

  expect(screen.getByRole('header', { name: 'Hoy' })).toBeTruthy();
});

it('muestra la línea de progreso del día', () => {
  renderHeader(3, []);

  expect(screen.getByLabelText('0 de 3 marcadas')).toBeTruthy();
});

import { describe, expect, it, jest } from '@jest/globals';
import { within } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import { Text } from 'react-native';
import Svg from 'react-native-svg';

import { ThemeContext } from '@/theme/theme-context';
import { themeColors, themeFonts, themeShapes } from '@/theme/tokens';

import TabsLayout from '../app/(tabs)/_layout';

jest.mock('@/components/quick-add', () => ({ QuickAddButton: () => null }));
jest.mock('@/data/past-pending', () => ({ usePastPendingCount: () => 0 }));
jest.mock('@/data/use-today', () => ({ useToday: () => '2026-10-09' }));

const themeValue = {
  themeName: 'white' as const,
  preference: 'white' as const,
  setPreference: () => {},
  colors: themeColors.white,
  fonts: themeFonts.white,
  shape: themeShapes.white,
};

function ThemedTabsLayout() {
  return (
    <ThemeContext.Provider value={themeValue}>
      <TabsLayout />
    </ThemeContext.Provider>
  );
}

const routes = {
  '(tabs)/_layout': ThemedTabsLayout,
  '(tabs)/hoy': () => <Text>Today screen</Text>,
  '(tabs)/bandeja': () => <Text>Inbox screen</Text>,
  '(tabs)/categorias': () => <Text>Categories screen</Text>,
  '(tabs)/pendientes': () => <Text>Pending screen</Text>,
  '(tabs)/historial': () => <Text>History screen</Text>,
  ajustes: () => <Text>Settings screen</Text>,
};

describe('Tabs layout', () => {
  it('shows the Today title only once, in the screen and not in the header', async () => {
    renderRouter(routes, { initialUrl: '/hoy' });
    await screen.findByText('Today screen');

    expect(screen.queryAllByRole('heading', { name: 'Hoy' })).toHaveLength(0);
  });

  it('keeps the header title on the other tabs', async () => {
    renderRouter(routes, { initialUrl: '/bandeja' });
    await screen.findByText('Inbox screen');

    expect(screen.getAllByRole('heading', { name: 'Bandeja' })).toHaveLength(1);
  });

  // Guarda, no regresión: el segundo engranaje que se ve en Expo Go es la
  // burbuja «Tools» de Expo Go, no un icono de la app.
  it('draws a single settings icon in the header button', async () => {
    renderRouter(routes, { initialUrl: '/hoy' });
    await screen.findByText('Today screen');

    const button = screen.getByRole('link', { name: 'Ajustes' });
    expect(within(button).UNSAFE_getAllByType(Svg)).toHaveLength(1);
  });
});

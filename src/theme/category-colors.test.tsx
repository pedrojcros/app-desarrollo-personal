import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import {
  CATEGORY_COLORS,
  getCategoryColorLabel,
  useCategoryColorValue,
} from './category-colors';
import { ThemeContext } from './theme-context';
import {
  themeColors,
  themeFonts,
  themeNames,
  themeShapes,
  type ThemeName,
} from './tokens';

function ColorProbe() {
  const colorValue = useCategoryColorValue('garnet');
  return <Text testID="color-value">{colorValue}</Text>;
}

function renderInTheme(themeName: ThemeName) {
  const themeContextValue = {
    themeName,
    preference: themeName,
    setPreference: () => {},
    colors: themeColors[themeName],
    fonts: themeFonts[themeName],
    shape: themeShapes[themeName],
  };

  render(
    <ThemeContext.Provider value={themeContextValue}>
      <ColorProbe />
    </ThemeContext.Provider>,
  );
}

describe('category colors', () => {
  it('lists the five colors by name', () => {
    expect([...CATEGORY_COLORS]).toEqual([
      'teal',
      'blue',
      'green',
      'amber',
      'garnet',
    ]);
  });

  it('labels every color in Spanish', () => {
    const labels = CATEGORY_COLORS.map(getCategoryColorLabel);

    expect(labels).toEqual([
      'Verde azulado',
      'Azul',
      'Verde',
      'Ámbar',
      'Granate',
    ]);
  });

  it('returns the value of the active theme', () => {
    const valuesByTheme = themeNames.map((themeName) => {
      renderInTheme(themeName);
      const value = screen.getByTestId('color-value').props.children;
      screen.unmount();
      return value;
    });

    expect(valuesByTheme).toEqual(
      themeNames.map((themeName) => themeColors[themeName]['category-garnet']),
    );
    expect(new Set(valuesByTheme).size).toBe(themeNames.length);
  });
});

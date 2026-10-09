import { vars } from 'nativewind';
import { useMemo, type PropsWithChildren } from 'react';
import { View } from 'react-native';

import { ThemeContext, type ThemeContextValue } from './theme-context';
import {
  colorTokens,
  themeColors,
  themeFonts,
  themeNames,
  themeShapes,
  type ThemeName,
  type ThemePreference,
} from './tokens';

type ThemeVariables = ReturnType<typeof vars>;

// NativeWind lee los colores como «R G B» para poder aplicar transparencia.
function hexToChannels(hexColor: string): string {
  const digits = hexColor.replace('#', '');
  const red = parseInt(digits.slice(0, 2), 16);
  const green = parseInt(digits.slice(2, 4), 16);
  const blue = parseInt(digits.slice(4, 6), 16);
  return `${red} ${green} ${blue}`;
}

function buildThemeVariables(themeName: ThemeName): ThemeVariables {
  const colors = themeColors[themeName];
  const variables: Record<string, string> = {};
  for (const token of colorTokens) {
    variables[`--color-${token}`] = hexToChannels(colors[token]);
  }
  return vars(variables);
}

const variablesByTheme = Object.fromEntries(
  themeNames.map((themeName) => [themeName, buildThemeVariables(themeName)]),
) as Record<ThemeName, ThemeVariables>;

type ThemeScopeProps = PropsWithChildren<{
  themeName: ThemeName;
  preference?: ThemePreference;
  setPreference?: (preference: ThemePreference) => void;
  className?: string;
}>;

function ignorePreference() {}

// Aplica un tema a todo lo que lleva dentro. La app lo usa una vez, en la raíz;
// el catálogo lo usa una vez por tema para verlos a la vez.
export function ThemeScope({
  themeName,
  preference = themeName,
  setPreference = ignorePreference,
  className,
  children,
}: ThemeScopeProps) {
  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      themeName,
      preference,
      setPreference,
      colors: themeColors[themeName],
      fonts: themeFonts[themeName],
      shape: themeShapes[themeName],
    }),
    [themeName, preference, setPreference],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <View style={variablesByTheme[themeName]} className={className}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

import {
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useColorScheme } from 'react-native';

import { fontSources } from './fonts';
import { loadThemePreference, saveThemePreference } from './preference-storage';
import { resolveTheme } from './resolve-theme';
import { ThemeScope } from './theme-scope';
import { themeColors, type ThemePreference } from './tokens';

function ignoreError() {}

// Mantiene la pantalla de arranque hasta tener el tema y las fuentes: así no
// hay parpadeo de un tema o una letra a otra.
SplashScreen.preventAutoHideAsync().catch(ignoreError);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemColorScheme = useColorScheme();
  const [preference, setPreferenceState] =
    useState<ThemePreference>('automatic');
  const [isPreferenceLoaded, setIsPreferenceLoaded] = useState(false);
  const [areFontsLoaded, fontError] = useFonts(fontSources);

  useEffect(() => {
    let isCancelled = false;
    loadThemePreference().then((storedPreference) => {
      if (isCancelled) {
        return;
      }
      setPreferenceState(storedPreference);
      setIsPreferenceLoaded(true);
    });
    return () => {
      isCancelled = true;
    };
  }, []);

  const setPreference = useCallback((newPreference: ThemePreference) => {
    setPreferenceState(newPreference);
    saveThemePreference(newPreference);
  }, []);

  // Si las fuentes fallan, la app sigue con la fuente del sistema.
  const areFontsSettled = areFontsLoaded || fontError !== null;
  const isReady = isPreferenceLoaded && areFontsSettled;

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync().catch(ignoreError);
    }
  }, [isReady]);

  const themeName = resolveTheme(preference, systemColorScheme);
  const navigationTheme = useMemo(() => {
    const colors = themeColors[themeName];
    return {
      ...DefaultTheme,
      dark: themeName === 'black',
      colors: {
        ...DefaultTheme.colors,
        primary: colors['accent-text'],
        background: colors.background,
        card: colors.surface,
        text: colors.foreground,
        border: colors.border,
        notification: colors.accent,
      },
    };
  }, [themeName]);

  if (!isReady) {
    return null;
  }

  const statusBarStyle = themeName === 'black' ? 'light' : 'dark';

  return (
    <ThemeScope
      themeName={themeName}
      preference={preference}
      setPreference={setPreference}
      className="flex-1 bg-background"
    >
      <NavigationThemeProvider value={navigationTheme}>
        {children}
        <StatusBar style={statusBarStyle} />
      </NavigationThemeProvider>
    </ThemeScope>
  );
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import { ThemeProvider } from './provider';
import { useTheme } from './theme-context';

let mockPhoneColorSchemeValue: 'light' | 'dark' = 'light';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockPhoneColorSchemeValue,
}));
jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));
jest.mock('expo-router', () => ({
  DefaultTheme: { dark: false, colors: {}, fonts: {} },
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: () => Promise.resolve(true),
  hideAsync: () => Promise.resolve(true),
}));

function ThemeProbe() {
  const { themeName, preference, setPreference } = useTheme();

  return (
    <>
      <Text testID="theme-name">{themeName}</Text>
      <Text testID="preference">{preference}</Text>
      <Pressable
        accessibilityLabel="fix-bold"
        onPress={() => setPreference('bold')}
      />
      <Pressable
        accessibilityLabel="back-to-automatic"
        onPress={() => setPreference('automatic')}
      />
    </>
  );
}

async function renderProvider() {
  render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>,
  );
  await screen.findByTestId('theme-name');
}

function mockPhoneColorScheme(colorScheme: 'light' | 'dark') {
  mockPhoneColorSchemeValue = colorScheme;
}

describe('ThemeProvider', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('follows the phone light mode by default', async () => {
    mockPhoneColorScheme('light');

    await renderProvider();

    expect(screen.getByTestId('theme-name').props.children).toBe('white');
    expect(screen.getByTestId('preference').props.children).toBe('automatic');
  });

  it('follows the phone dark mode by default', async () => {
    mockPhoneColorScheme('dark');

    await renderProvider();

    expect(screen.getByTestId('theme-name').props.children).toBe('black');
  });

  it('saves a fixed theme and recovers it after reopening the app', async () => {
    mockPhoneColorScheme('dark');
    await renderProvider();

    await act(async () => {
      fireEvent.press(screen.getByLabelText('fix-bold'));
    });

    expect(screen.getByTestId('theme-name').props.children).toBe('bold');
    expect(await AsyncStorage.getItem('theme-preference')).toBe('bold');

    screen.unmount();
    await renderProvider();

    expect(screen.getByTestId('theme-name').props.children).toBe('bold');
    expect(screen.getByTestId('preference').props.children).toBe('bold');
  });

  it('goes back to following the phone when Automatic is chosen', async () => {
    mockPhoneColorScheme('dark');
    await AsyncStorage.setItem('theme-preference', 'white');
    await renderProvider();
    expect(screen.getByTestId('theme-name').props.children).toBe('white');

    await act(async () => {
      fireEvent.press(screen.getByLabelText('back-to-automatic'));
    });

    expect(screen.getByTestId('theme-name').props.children).toBe('black');
  });

  it('ignores a stored value that is not a theme', async () => {
    mockPhoneColorScheme('light');
    await AsyncStorage.setItem('theme-preference', 'neon');

    await renderProvider();

    expect(screen.getByTestId('preference').props.children).toBe('automatic');
  });
});

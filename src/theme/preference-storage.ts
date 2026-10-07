import AsyncStorage from '@react-native-async-storage/async-storage';

import { themePreferences, type ThemePreference } from './tokens';

const storageKey = 'theme-preference';

function isThemePreference(value: string | null): value is ThemePreference {
  return themePreferences.some((preference) => preference === value);
}

// En Android guarda en el almacén del dispositivo; en la web, en localStorage.
export async function loadThemePreference(): Promise<ThemePreference> {
  try {
    const storedValue = await AsyncStorage.getItem(storageKey);
    if (isThemePreference(storedValue)) {
      return storedValue;
    }
  } catch {
    // Sin almacén se usa el valor por defecto: la app tiene que arrancar igual.
  }
  return 'automatic';
}

export async function saveThemePreference(
  preference: ThemePreference,
): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey, preference);
  } catch {
    // Si no se puede guardar, el tema elegido sigue valiendo hasta cerrar la app.
  }
}

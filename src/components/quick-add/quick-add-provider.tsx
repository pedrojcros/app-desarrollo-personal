import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeScope } from '@/theme/theme-scope';
import { useTheme } from '@/theme/theme-context';
import { useWebViewport } from './use-web-viewport';
import { QuickAddBar } from './quick-add-bar';

import type { QuickAddDefaults } from '@/domain/quick-add';
export type { QuickAddDefaults } from '@/domain/quick-add';
interface QuickAddContextValue {
  open(defaults: QuickAddDefaults): void;
  close(): void;
}
const QuickAddContext = createContext<QuickAddContextValue | null>(null);
export function useQuickAdd(): QuickAddContextValue {
  const context = useContext(QuickAddContext);
  if (context === null) {
    throw new Error('QuickAddProvider is required');
  }
  return context;
}
export function QuickAddProvider({ children }: { children: ReactNode }) {
  const viewportStyle = useWebViewport();
  const [defaults, setDefaults] = useState<QuickAddDefaults | null>(null);
  const insets = useSafeAreaInsets();
  const { themeName, preference, setPreference } = useTheme();
  const close = useCallback(() => {
    Keyboard.dismiss();
    setDefaults(null);
  }, []);
  useEffect(() => {
    if (defaults === null || Platform.OS !== 'web') {
      return;
    }
    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        close();
      }
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [defaults, close]);
  return (
    <QuickAddContext.Provider value={{ open: setDefaults, close }}>
      {children}
      {defaults !== null ? (
        <Modal
          accessibilityLabel="Añadir rápido"
          transparent
          visible
          onRequestClose={close}
          statusBarTranslucent
          navigationBarTranslucent
        >
          <ThemeScope
            themeName={themeName}
            preference={preference}
            setPreference={setPreference}
            className="flex-1"
          >
            <KeyboardAvoidingView
              enabled={Platform.OS !== 'web'}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={viewportStyle}
              className="flex-1"
            >
              <Pressable
                accessibilityLabel="Cerrar añadir rápido"
                role="button"
                className="flex-1"
                onPress={close}
              />
              <View
                className="w-full max-w-xl self-center bg-surface"
                style={{ paddingBottom: insets.bottom }}
              >
                <QuickAddBar defaults={defaults} close={close} />
              </View>
            </KeyboardAvoidingView>
          </ThemeScope>
        </Modal>
      ) : null}
    </QuickAddContext.Provider>
  );
}

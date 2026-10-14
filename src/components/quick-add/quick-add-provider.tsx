import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
import type {
  QuickAddDraft,
  QuickAddDraftStorage,
} from './use-quick-add-draft';
import { QuickAddBar } from './quick-add-bar';
import type { QuickAddSelector } from './quick-add-selector';

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
  const savedDraft = useRef<QuickAddDraft>(undefined);
  const [restoredDraft, setRestoredDraft] = useState<QuickAddDraft>();
  const openSelectors = useRef(new Set<QuickAddSelector>());
  const submitting = useRef(false);
  const [defaults, setDefaults] = useState<QuickAddDefaults | null>(null);
  const insets = useSafeAreaInsets();
  // En Android el diálogo ajusta sus propios insets, incluido el teclado.
  // La translucidez impide ese ajuste en la ventana separada del modal.
  // https://reactnative.dev/docs/0.85/modal#statusbartranslucent
  const usesAndroidWindowInsets = Platform.OS === 'android';
  const bottomPadding = usesAndroidWindowInsets ? 0 : insets.bottom;
  const { themeName, preference, setPreference } = useTheme();
  const open = useCallback((nextDefaults: QuickAddDefaults) => {
    setRestoredDraft(savedDraft.current);
    setDefaults(nextDefaults);
  }, []);
  const saveDraft = useCallback((draft: QuickAddDraft) => {
    savedDraft.current = draft;
  }, []);
  const clearDraft = useCallback(() => {
    savedDraft.current = undefined;
  }, []);
  const draftStorage = useMemo<QuickAddDraftStorage>(
    () => ({ restored: restoredDraft, save: saveDraft, clear: clearDraft }),
    [restoredDraft, saveDraft, clearDraft],
  );
  const close = useCallback(() => {
    setDefaults(null);
    openSelectors.current.clear();
    submitting.current = false;
    Keyboard.dismiss();
  }, []);
  const closeOnKeyboardHide = useCallback(() => {
    if (openSelectors.current.size > 0 || submitting.current) {
      return;
    }
    close();
  }, [close]);
  const isMenuOpen = defaults !== null;
  const viewportStyle = useWebViewport(isMenuOpen, closeOnKeyboardHide);
  const onSubmittingChange = useCallback((isSubmitting: boolean) => {
    submitting.current = isSubmitting;
  }, []);
  const onSelectorOpenChange = useCallback(
    (selector: QuickAddSelector, isOpen: boolean) => {
      if (isOpen) {
        openSelectors.current.add(selector);
        return;
      }
      openSelectors.current.delete(selector);
    },
    [],
  );
  useEffect(() => {
    if (defaults === null || Platform.OS === 'web') {
      return;
    }
    const subscription = Keyboard.addListener(
      'keyboardDidHide',
      closeOnKeyboardHide,
    );
    return () => subscription.remove();
  }, [defaults, closeOnKeyboardHide]);
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
    <QuickAddContext.Provider value={{ open, close }}>
      {children}
      {defaults !== null ? (
        <Modal
          accessibilityLabel="Añadir rápido"
          transparent
          visible
          onRequestClose={close}
          statusBarTranslucent={!usesAndroidWindowInsets}
          navigationBarTranslucent={!usesAndroidWindowInsets}
        >
          <ThemeScope
            themeName={themeName}
            preference={preference}
            setPreference={setPreference}
            className="flex-1"
          >
            <KeyboardAvoidingView
              enabled={Platform.OS === 'ios'}
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
                style={{ paddingBottom: bottomPadding }}
              >
                <QuickAddBar
                  defaults={defaults}
                  close={close}
                  draftStorage={draftStorage}
                  onSelectorOpenChange={onSelectorOpenChange}
                  onSubmittingChange={onSubmittingChange}
                />
              </View>
            </KeyboardAvoidingView>
          </ThemeScope>
        </Modal>
      ) : null}
    </QuickAddContext.Provider>
  );
}

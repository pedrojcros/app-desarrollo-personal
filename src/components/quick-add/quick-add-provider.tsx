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
import {
  QuickAddTransition,
  type QuickAddOrigin,
} from './quick-add-transition';
import type { QuickAddSelector } from './quick-add-selector';

import type { QuickAddDefaults } from '@/domain/quick-add';
export type { QuickAddDefaults } from '@/domain/quick-add';
interface QuickAddContextValue {
  open(defaults: QuickAddDefaults, origin?: QuickAddOrigin): void;
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
  const awaitingKeyboardAfterSave = useRef(false);
  // `defaults` sigue lleno mientras el menú se cierra animado: solo se vacía
  // cuando la animación termina y ya se puede desmontar el modal.
  const [defaults, setDefaults] = useState<QuickAddDefaults | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isModalShown, setIsModalShown] = useState(false);
  const [origin, setOrigin] = useState<QuickAddOrigin>();
  const insets = useSafeAreaInsets();
  // En Android el diálogo ajusta sus propios insets, incluido el teclado.
  // La translucidez impide ese ajuste en la ventana separada del modal.
  // https://reactnative.dev/docs/0.85/modal#statusbartranslucent
  const usesAndroidWindowInsets = Platform.OS === 'android';
  const bottomPadding = usesAndroidWindowInsets ? 0 : insets.bottom;
  const { themeName, preference, setPreference } = useTheme();
  const open = useCallback(
    (nextDefaults: QuickAddDefaults, nextOrigin?: QuickAddOrigin) => {
      setRestoredDraft(savedDraft.current);
      setOrigin(nextOrigin);
      setIsClosing(false);
      setIsModalShown(false);
      setDefaults(nextDefaults);
    },
    [],
  );
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
    setIsClosing(true);
    setIsModalShown(false);
    openSelectors.current.clear();
    submitting.current = false;
    awaitingKeyboardAfterSave.current = false;
    Keyboard.dismiss();
  }, []);
  const closeOnKeyboardHide = useCallback(() => {
    if (openSelectors.current.size > 0 || submitting.current) {
      return;
    }
    close();
  }, [close]);
  const unmountMenu = useCallback(() => {
    setDefaults(null);
    setIsClosing(false);
  }, []);
  const isMenuOpen = defaults !== null && !isClosing;
  const viewportStyle = useWebViewport(isMenuOpen, closeOnKeyboardHide);
  const onSubmittingChange = useCallback((isSubmitting: boolean) => {
    // Pedir foco no garantiza que el teclado haya terminado de ocultarse.
    if (Platform.OS === 'android' && !isSubmitting) {
      awaitingKeyboardAfterSave.current = true;
      return;
    }
    submitting.current = isSubmitting;
    awaitingKeyboardAfterSave.current = false;
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
    if (!isMenuOpen || Platform.OS === 'web') {
      return;
    }
    const hideSubscription = Keyboard.addListener(
      'keyboardDidHide',
      closeOnKeyboardHide,
    );
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      if (!awaitingKeyboardAfterSave.current) {
        return;
      }
      awaitingKeyboardAfterSave.current = false;
      submitting.current = false;
    });
    return () => {
      hideSubscription.remove();
      showSubscription.remove();
    };
  }, [isMenuOpen, closeOnKeyboardHide]);
  useEffect(() => {
    if (!isMenuOpen || Platform.OS !== 'web') {
      return;
    }
    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        close();
      }
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isMenuOpen, close]);
  return (
    <QuickAddContext.Provider value={{ open, close }}>
      {children}
      {defaults !== null ? (
        <Modal
          accessibilityLabel="Añadir rápido"
          transparent
          visible
          onRequestClose={close}
          onShow={() => setIsModalShown(true)}
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
              <QuickAddTransition
                isOpen={isMenuOpen}
                origin={origin}
                onClosed={unmountMenu}
              >
                <View
                  className="w-full max-w-xl self-center bg-surface"
                  style={{ paddingBottom: bottomPadding }}
                >
                  <QuickAddBar
                    defaults={defaults}
                    isModalShown={isModalShown}
                    close={close}
                    draftStorage={draftStorage}
                    onSelectorOpenChange={onSelectorOpenChange}
                    onSubmittingChange={onSubmittingChange}
                  />
                </View>
              </QuickAddTransition>
            </KeyboardAvoidingView>
          </ThemeScope>
        </Modal>
      ) : null}
    </QuickAddContext.Provider>
  );
}

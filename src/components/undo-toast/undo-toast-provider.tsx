import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UndoNotice } from '@/components/ui/undo-notice';

/** DEC-37: el aviso de «Deshacer» dura 4 segundos. */
export const NOTICE_DURATION_MILLISECONDS = 4000;

// Alto de la barra de pestañas (el mismo que usa src/app/(tabs)/_layout.tsx),
// para que el aviso quede por encima de ella en todas las pantallas.
const TAB_BAR_HEIGHT = 74;
const NOTICE_GAP = 12;
const SCREEN_MARGIN = 16;
export interface NoticeOptions {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface UndoToastContextValue {
  showNotice: (options: NoticeOptions) => void;
  hideNotice: () => void;
}

const UndoToastContext = createContext<UndoToastContextValue | undefined>(
  undefined,
);

export function useUndoToast(): UndoToastContextValue {
  const context = useContext(UndoToastContext);
  if (context === undefined) {
    throw new Error('useUndoToast must be used inside an UndoToastProvider');
  }
  return context;
}

type VisibleNotice = NoticeOptions & {
  // Cambia con cada aviso para que uno nuevo se pinte como otro distinto.
  id: number;
};

interface UndoToastProviderProps {
  children: ReactNode;
  noticeDurationMilliseconds?: number;
}

export function UndoToastProvider({
  children,
  noticeDurationMilliseconds = NOTICE_DURATION_MILLISECONDS,
}: UndoToastProviderProps) {
  const [notice, setNotice] = useState<VisibleNotice | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextIdRef = useRef(0);
  const insets = useSafeAreaInsets();

  const clearTimer = useCallback(() => {
    if (timerRef.current === null) {
      return;
    }
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const hideNotice = useCallback(() => {
    clearTimer();
    setNotice(null);
  }, [clearTimer]);

  const showNotice = useCallback(
    (options: NoticeOptions) => {
      clearTimer();
      nextIdRef.current += 1;
      setNotice({ ...options, id: nextIdRef.current });
      timerRef.current = setTimeout(hideNotice, noticeDurationMilliseconds);
      // iOS no lee las regiones en vivo: se anuncia el texto sin mover el foco.
      if (Platform.OS === 'ios') {
        AccessibilityInfo.announceForAccessibility(options.message);
      }
    },
    [clearTimer, hideNotice, noticeDurationMilliseconds],
  );

  useEffect(() => clearTimer, [clearTimer]);

  const contextValue = useMemo(
    () => ({ showNotice, hideNotice }),
    [showNotice, hideNotice],
  );

  function runAction(): void {
    const action = notice?.onAction;
    // Se cierra antes de actuar: la acción puede mostrar otro aviso.
    hideNotice();
    action?.();
  }

  const containerStyle = {
    position: 'absolute' as const,
    left: SCREEN_MARGIN,
    right: SCREEN_MARGIN,
    bottom: TAB_BAR_HEIGHT + insets.bottom + NOTICE_GAP,
  };
  return (
    <UndoToastContext.Provider value={contextValue}>
      {children}
      {/* box-none: los toques pasan a la pantalla de debajo salvo en el aviso. */}
      <View
        pointerEvents="box-none"
        style={containerStyle}
        accessibilityLiveRegion="polite"
      >
        {notice !== null && (
          <View key={notice.id}>
            <UndoNotice
              message={notice.message}
              actionLabel={notice.actionLabel}
              onAction={notice.onAction === undefined ? undefined : runAction}
            />
          </View>
        )}
      </View>
    </UndoToastContext.Provider>
  );
}

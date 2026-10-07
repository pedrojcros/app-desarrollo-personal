import { useEffect, useRef } from 'react';
import { BackHandler, Platform, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme/theme-context';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** La confirmación borra o quita algo: se pinta con el color de «no hecho». */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// Escape en la web y «atrás» en Android cancelan, como un diálogo nativo.
function useCancelOnDismissKey(visible: boolean, onCancel: () => void): void {
  useEffect(() => {
    if (!visible) {
      return;
    }
    if (Platform.OS === 'web') {
      function cancelOnEscape(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
          onCancel();
        }
      }
      document.addEventListener('keydown', cancelOnEscape);
      return () => document.removeEventListener('keydown', cancelOnEscape);
    }
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onCancel();
        return true;
      },
    );
    return () => subscription.remove();
  }, [visible, onCancel]);
}

// No usa `Modal` ni `Alert.alert`: el primero se pinta fuera del tema y el
// segundo no existe en la web. Es una capa dentro de la propia pantalla, que
// por eso tiene que ir fuera de su lista con desplazamiento.
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancelar',
  destructive,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { shape, colors } = useTheme();
  const cancelButtonReference = useRef<View>(null);
  useCancelOnDismissKey(visible, onCancel);

  // La acción segura recibe el foco: Enter sin querer no borra nada.
  useEffect(() => {
    if (visible) {
      cancelButtonReference.current?.focus?.();
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  const panelStyle = {
    borderRadius: shape.floatingRadius,
    borderWidth: Math.max(shape.outlineWidth, 1),
    borderColor: colors.border,
    boxShadow: shape.smallShadow,
  };
  // El color de «no hecho» cambia de claridad según el tema: el texto toma el
  // del fondo para que siempre contraste con él.
  const confirmClassName = destructive ? 'bg-not-done' : undefined;
  const confirmTextClassName = destructive ? 'text-background' : undefined;

  return (
    <View className="absolute inset-0 z-10 items-center justify-center bg-inverse/60 px-4">
      <View
        role="alertdialog"
        aria-modal
        accessibilityViewIsModal
        accessibilityLabel={title}
        className="w-full max-w-sm gap-3 bg-surface p-5"
        style={panelStyle}
      >
        <Text variant="headline">{title}</Text>
        <Text>{message}</Text>
        <View className="mt-2 flex-row justify-end gap-2">
          <Button
            ref={cancelButtonReference}
            variant="secondary"
            onPress={onCancel}
          >
            <Text>{cancelLabel}</Text>
          </Button>
          <Button className={confirmClassName} onPress={onConfirm}>
            <Text className={confirmTextClassName}>{confirmLabel}</Text>
          </Button>
        </View>
      </View>
    </View>
  );
}

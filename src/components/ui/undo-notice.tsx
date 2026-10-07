import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/theme-context';

import { Text } from './text';
import { usePressed } from './use-pressed';

type UndoNoticeProps = {
  message: string;
  actionLabel?: string;
  onAction: () => void;
  // Fuerza el estado pulsado del botón (catálogo y tests).
  pressed?: boolean;
};

// Aviso de abajo: «Marcada como hecha» a la izquierda y «Deshacer» en negrita a
// la derecha. Solo es la parte visual; deshacer de verdad es de T07.
export function UndoNotice({
  message,
  actionLabel = 'Deshacer',
  onAction,
  pressed,
}: UndoNoticeProps) {
  const { shape, colors } = useTheme();
  const press = usePressed(pressed);
  const noticeStyle = {
    borderRadius: shape.controlRadius,
    borderWidth: shape.noticeBorderWidth,
    borderColor: colors.border,
    boxShadow: shape.noticeShadow,
  };
  const actionClassName = press.isPressed
    ? 'min-h-11 justify-center px-3 opacity-60'
    : 'min-h-11 justify-center px-3';

  return (
    <View
      role="status"
      className="min-h-12 flex-row items-center justify-between bg-inverse pl-4 pr-1"
      style={noticeStyle}
    >
      <Text
        variant="callout"
        weight="medium"
        className="text-inverse-foreground"
      >
        {message}
      </Text>
      <Pressable
        role="button"
        className={actionClassName}
        onPress={onAction}
        onPressIn={press.handlePressIn}
        onPressOut={press.handlePressOut}
      >
        <Text variant="callout" weight="bold" className="text-inverse-accent">
          {actionLabel}
        </Text>
      </Pressable>
    </View>
  );
}

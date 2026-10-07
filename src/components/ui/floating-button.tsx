import { Plus } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { useTheme } from '@/theme/theme-context';

import { Icon } from './icon';
import { usePressed } from './use-pressed';

type FloatingButtonProps = {
  onPress: () => void;
  accessibilityLabel?: string;
  pressed?: boolean;
};

// El botón + redondo de abajo a la derecha, encima de la barra de pestañas.
export function FloatingButton({
  onPress,
  accessibilityLabel = 'Añadir tarea o hábito',
  pressed,
}: FloatingButtonProps) {
  const { shape, colors } = useTheme();
  const press = usePressed(pressed);
  const pressedClassName = press.isPressed ? 'scale-95 opacity-90' : '';
  const buttonStyle = {
    borderRadius: shape.floatingRadius,
    borderWidth: shape.outlineWidth,
    borderColor: colors.border,
    boxShadow: shape.floatingShadow,
  };

  return (
    <Pressable
      role="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onPressIn={press.handlePressIn}
      onPressOut={press.handlePressOut}
      className={`h-14 w-14 items-center justify-center bg-accent ${pressedClassName}`}
      style={buttonStyle}
    >
      <Icon icon={Plus} color="accent-foreground" size={26} />
    </Pressable>
  );
}

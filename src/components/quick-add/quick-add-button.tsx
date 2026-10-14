import { Plus } from 'lucide-react-native';
import { useRef } from 'react';
import { Pressable, type View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { usePressed } from '@/components/ui/use-pressed';
import { useTheme } from '@/theme/theme-context';
import { useQuickAdd } from './quick-add-provider';
import type { QuickAddOrigin } from './quick-add-transition';
import type { QuickAddDefaults } from '@/domain/quick-add';

export function QuickAddButton({ defaults }: { defaults: QuickAddDefaults }) {
  const { open } = useQuickAdd();
  const { shape, colors } = useTheme();
  const press = usePressed(undefined);
  const buttonReference = useRef<View>(null);
  const origin = useRef<QuickAddOrigin>(undefined);
  const pressedStyle = press.isPressed
    ? { opacity: 0.9, transform: [{ scale: 0.95 }] }
    : undefined;
  // Se mide al colocarse el botón y de nuevo al tocarlo: la segunda medida
  // recoge los movimientos que no cambian su tamaño (p. ej. los márgenes
  // seguros), y la primera evita llegar sin medida a un toque muy rápido.
  function rememberPosition() {
    buttonReference.current?.measureInWindow((left, top, width, height) => {
      origin.current = { left, top, width, height };
    });
  }
  function handlePressIn() {
    press.handlePressIn();
    rememberPosition();
  }
  return (
    <Pressable
      ref={buttonReference}
      onLayout={rememberPosition}
      role="button"
      accessibilityLabel="Añadir tarea o hábito"
      onPress={() => open(defaults, origin.current)}
      onPressIn={handlePressIn}
      onPressOut={press.handlePressOut}
      className="h-14 w-14 items-center justify-center rounded-full bg-accent"
      style={[
        {
          borderWidth: shape.outlineWidth,
          borderColor: colors.border,
          boxShadow: shape.floatingShadow,
        },
        pressedStyle,
      ]}
    >
      <Icon icon={Plus} color="accent-foreground" size={26} />
    </Pressable>
  );
}

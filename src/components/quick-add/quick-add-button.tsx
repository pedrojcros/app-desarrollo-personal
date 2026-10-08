import { Plus } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { usePressed } from '@/components/ui/use-pressed';
import { useTheme } from '@/theme/theme-context';
import { useQuickAdd } from './quick-add-provider';
import type { QuickAddDefaults } from '@/domain/quick-add';

export function QuickAddButton({ defaults }: { defaults: QuickAddDefaults }) {
  const { open } = useQuickAdd();
  const { shape, colors } = useTheme();
  const press = usePressed(undefined);
  const pressedStyle = press.isPressed
    ? { opacity: 0.9, transform: [{ scale: 0.95 }] }
    : undefined;
  return (
    <Pressable
      role="button"
      accessibilityLabel="Añadir tarea o hábito"
      onPress={() => open(defaults)}
      onPressIn={press.handlePressIn}
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

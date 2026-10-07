import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

type DayHeaderProps = {
  title: string;
  onMarkAllNotDone: () => void;
};

// Como SectionTitle, con la acción de marcar el día entero al final de la línea.
export function DayHeader({ title, onMarkAllNotDone }: DayHeaderProps) {
  return (
    <View className="mt-4 flex-row items-center gap-3">
      <Text variant="label" weight="semibold" accessibilityRole="header">
        {title}
      </Text>
      <View className="h-px flex-1 bg-border" />
      <Button
        size="small"
        variant="ghost"
        accessibilityLabel={`Todo no hecho: ${title}`}
        onPress={onMarkAllNotDone}
      >
        <Text>Todo no hecho</Text>
      </Button>
    </View>
  );
}

import { Switch, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme/theme-context';

type ReminderSwitchRowProps = {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export function ReminderSwitchRow({
  label,
  value,
  onValueChange,
}: ReminderSwitchRowProps) {
  const { colors } = useTheme();

  return (
    <View className="min-h-11 flex-row items-center justify-between gap-3 border-b border-border">
      <Text className="flex-1">{label}</Text>
      <Switch
        role="switch"
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor={colors.surface}
      />
    </View>
  );
}

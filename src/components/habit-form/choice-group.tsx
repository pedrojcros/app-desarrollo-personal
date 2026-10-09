import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

interface Choice<Value> {
  value: Value;
  label: string;
  accessibleLabel?: string;
}
interface ChoiceGroupProps<Value> {
  label: string;
  choices: Choice<Value>[];
  selected: Value[];
  multiple?: boolean;
  disabled?: boolean;
  onChoose: (value: Value) => void;
}

export function ChoiceGroup<Value extends string | number>({
  label,
  choices,
  selected,
  multiple = false,
  disabled,
  onChoose,
}: ChoiceGroupProps<Value>) {
  return (
    <View className="gap-2">
      <Text variant="callout" weight="semibold">
        {label}
      </Text>
      <View
        role={multiple ? 'group' : 'radiogroup'}
        accessibilityLabel={label}
        className="flex-row flex-wrap gap-2"
      >
        {choices.map((choice) => {
          const checked = selected.includes(choice.value);
          return (
            <Button
              key={choice.value}
              role={multiple ? 'checkbox' : 'radio'}
              accessibilityLabel={choice.accessibleLabel ?? choice.label}
              accessibilityState={{ checked, disabled }}
              aria-checked={checked}
              disabled={disabled}
              focusable
              variant={checked ? 'primary' : 'secondary'}
              size="small"
              onPress={() => onChoose(choice.value)}
            >
              <Text>{choice.label}</Text>
            </Button>
          );
        })}
      </View>
    </View>
  );
}

import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme/theme-context';

interface Choice<Value extends string> {
  value: Value;
  label: string;
}
interface UpwardChoiceProps<Value extends string> {
  label: string;
  value: Value;
  choices: Choice<Value>[];
  onChange(value: Value): void;
  disabled?: boolean;
}
export function UpwardChoice<Value extends string>({
  label,
  value,
  choices,
  onChange,
  disabled,
}: UpwardChoiceProps<Value>) {
  const [isOpen, setIsOpen] = useState(false);
  const { colors, shape } = useTheme();
  const selectedChoice = choices.find((choice) => choice.value === value);
  return (
    <View className="z-20 flex-1 justify-end">
      {/* Android recorta los límites accesibles si el menú sale de su padre. */}
      {isOpen ? (
        <View
          role="radiogroup"
          accessibilityLabel={label}
          className="mb-2 w-full bg-surface"
          style={{
            borderColor: colors.border,
            borderWidth: Math.max(shape.outlineWidth, 1),
            borderRadius: shape.controlRadius,
          }}
        >
          <ScrollView className="max-h-52" keyboardShouldPersistTaps="handled">
            {choices.map((choice) => (
              <Button
                key={choice.value}
                variant="ghost"
                size="small"
                accessibilityLabel={choice.label}
                role="radio"
                aria-checked={choice.value === value}
                onPress={() => {
                  onChange(choice.value);
                  setIsOpen(false);
                }}
              >
                <Text>{choice.label}</Text>
              </Button>
            ))}
          </ScrollView>
        </View>
      ) : null}
      <Button
        variant="secondary"
        size="small"
        accessibilityLabel={label}
        aria-expanded={isOpen}
        disabled={disabled}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text>{selectedChoice?.label}</Text>
      </Button>
    </View>
  );
}

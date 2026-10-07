import { useId } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme/theme-context';
import { parseCalendarDate } from '@/domain/calendar-date';
import { formatFullDate } from './format';
import type { DateFieldProps, TimeFieldProps } from './types';
export type { DateFieldProps, TimeFieldProps } from './types';

function useInputStyle() {
  const { colors, fonts, shape } = useTheme();
  return {
    color: colors.foreground,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: shape.controlRadius,
    fontFamily: fonts.regular,
    colorScheme: 'normal',
  };
}
export function DateField({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
}: DateFieldProps) {
  const inputId = useId();
  const inputStyle = useInputStyle();
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = event.currentTarget.value;
    if (nextValue === '') {
      return;
    }
    try {
      parseCalendarDate(nextValue);
    } catch {
      return;
    }
    onChange(nextValue);
  }
  return (
    <View className="gap-1">
      <label htmlFor={inputId}>
        <Text variant="callout" weight="semibold">
          {label}
        </Text>
      </label>
      <input
        id={inputId}
        aria-label={label}
        type="date"
        value={value}
        min={minimumDate}
        max={maximumDate}
        onChange={handleChange}
        style={inputStyle}
        className="min-h-12 w-full border px-3 py-2 text-callout"
      />
      <Text variant="caption" className="text-muted-foreground">
        {formatFullDate(value)}
      </Text>
    </View>
  );
}
export function TimeField({ label, value, onChange }: TimeFieldProps) {
  const inputId = useId();
  const inputStyle = useInputStyle();
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = event.currentTarget.value;
    if (!/^\d{2}:\d{2}$/.test(nextValue)) {
      return;
    }
    onChange(nextValue);
  }
  return (
    <View className="gap-1">
      <label htmlFor={inputId}>
        <Text variant="callout" weight="semibold">
          {label}
        </Text>
      </label>
      <input
        id={inputId}
        aria-label={label}
        type="time"
        value={value}
        onChange={handleChange}
        style={inputStyle}
        className="min-h-12 w-full border px-3 py-2 text-callout"
      />
    </View>
  );
}

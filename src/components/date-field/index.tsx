import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import {
  formatFullDate,
  fromDeviceDate,
  fromDeviceTime,
  toDeviceDate,
} from './format';
import type { DateFieldProps, TimeFieldProps } from './types';
export type { DateFieldProps, TimeFieldProps } from './types';

export function DateField({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
}: DateFieldProps) {
  function openPicker() {
    DateTimePickerAndroid.open({
      value: toDeviceDate(value),
      mode: 'date',
      minimumDate: minimumDate ? toDeviceDate(minimumDate) : undefined,
      maximumDate: maximumDate ? toDeviceDate(maximumDate) : undefined,
      onChange: (event, selectedDate) => {
        if (event.type !== 'set' || selectedDate === undefined) {
          return;
        }
        onChange(fromDeviceDate(selectedDate));
      },
    });
  }
  return (
    <View className="gap-1">
      <Text variant="callout" weight="semibold">
        {label}
      </Text>
      <Button
        variant="secondary"
        accessibilityLabel={label}
        onPress={openPicker}
        className="h-auto min-h-12 items-start px-3 py-2"
      >
        <Text variant="callout">{formatFullDate(value)}</Text>
      </Button>
    </View>
  );
}
export function TimeField({ label, value, onChange }: TimeFieldProps) {
  function openPicker() {
    const initialTime = new Date(`2000-01-01T${value}:00`);
    DateTimePickerAndroid.open({
      value: initialTime,
      mode: 'time',
      is24Hour: true,
      onChange: (event, selectedTime) => {
        if (event.type !== 'set' || selectedTime === undefined) {
          return;
        }
        onChange(fromDeviceTime(selectedTime));
      },
    });
  }
  return (
    <View className="gap-1">
      <Text variant="callout" weight="semibold">
        {label}
      </Text>
      <Button
        variant="secondary"
        accessibilityLabel={label}
        onPress={openPicker}
      >
        <Text>{value}</Text>
      </Button>
    </View>
  );
}

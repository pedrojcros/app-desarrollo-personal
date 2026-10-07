import { View } from 'react-native';
import { TimeField } from '@/components/date-field';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import type { Frequency, IsoWeekday, TimeSlot } from '@/domain/types';
import { UpwardChoice } from './upward-choice';

export interface QuickHabitOptions {
  frequency: Frequency;
  weekdays: IsoWeekday[];
  intervalText: string;
  moment: TimeSlot | 'none' | 'exact';
  timeOfDay: string;
}
const frequencies: { value: Frequency; label: string }[] = [
  { value: 'daily', label: 'Todos los días' },
  { value: 'weekdays', label: 'Días de la semana' },
  { value: 'every_n_days', label: 'Cada N días' },
  { value: 'monthly', label: 'Cada mes' },
];
const moments: { value: QuickHabitOptions['moment']; label: string }[] = [
  { value: 'none', label: 'Sin hora' },
  { value: 'morning', label: 'Mañana' },
  { value: 'afternoon', label: 'Tarde' },
  { value: 'night', label: 'Noche' },
  { value: 'exact', label: 'Hora exacta' },
];
const weekdays: { value: IsoWeekday; label: string }[] = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
];
export function HabitOptions({
  value,
  onChange,
  disabled,
}: {
  value: QuickHabitOptions;
  onChange(value: QuickHabitOptions): void;
  disabled: boolean;
}) {
  function change(changes: Partial<QuickHabitOptions>): void {
    onChange({ ...value, ...changes });
  }
  function toggleWeekday(weekday: IsoWeekday): void {
    const isSelected = value.weekdays.includes(weekday);
    const nextDays = isSelected
      ? value.weekdays.filter((day) => day !== weekday)
      : [...value.weekdays, weekday];
    change({ weekdays: nextDays });
  }
  return (
    <View className="gap-2">
      <View className="z-30 flex-row gap-2">
        <UpwardChoice
          label="Frecuencia"
          value={value.frequency}
          choices={frequencies}
          disabled={disabled}
          onChange={(frequency) => change({ frequency })}
        />
        <UpwardChoice
          label="Cuándo"
          value={value.moment}
          choices={moments}
          disabled={disabled}
          onChange={(moment) => change({ moment })}
        />
      </View>
      {value.frequency === 'weekdays' ? (
        <View
          role="group"
          accessibilityLabel="Días de la semana"
          className="flex-row flex-wrap gap-1"
        >
          {weekdays.map((weekday) => (
            <Button
              key={weekday.value}
              size="small"
              variant={
                value.weekdays.includes(weekday.value) ? 'primary' : 'secondary'
              }
              role="checkbox"
              aria-checked={value.weekdays.includes(weekday.value)}
              accessibilityLabel={weekday.label}
              disabled={disabled}
              onPress={() => toggleWeekday(weekday.value)}
            >
              <Text>{weekday.label.slice(0, 2)}</Text>
            </Button>
          ))}
        </View>
      ) : null}
      {value.frequency === 'every_n_days' ? (
        <TextField
          label="Cada cuántos días"
          keyboardType="number-pad"
          value={value.intervalText}
          editable={!disabled}
          onChangeText={(intervalText) => change({ intervalText })}
        />
      ) : null}
      {value.moment === 'exact' ? (
        <TimeField
          label="Hora exacta"
          value={value.timeOfDay}
          onChange={(timeOfDay) => change({ timeOfDay })}
        />
      ) : null}
    </View>
  );
}

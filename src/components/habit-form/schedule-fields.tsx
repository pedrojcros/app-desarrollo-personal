import { View } from 'react-native';
import { TimeField } from '@/components/date-field';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import type { HabitInput } from '@/data/habits';
import type { Frequency, IsoWeekday, TimeSlot } from '@/domain/types';
import { ChoiceGroup } from './choice-group';

const frequencies: { value: Frequency; label: string }[] = [
  { value: 'daily', label: 'Todos los días' },
  { value: 'weekdays', label: 'Días de la semana' },
  { value: 'every_n_days', label: 'Cada N días' },
  { value: 'monthly', label: 'Cada mes' },
];
const weekdays: {
  value: IsoWeekday;
  label: string;
  accessibleLabel: string;
}[] = [
  { value: 1, label: 'L', accessibleLabel: 'Lunes' },
  { value: 2, label: 'M', accessibleLabel: 'Martes' },
  { value: 3, label: 'X', accessibleLabel: 'Miércoles' },
  { value: 4, label: 'J', accessibleLabel: 'Jueves' },
  { value: 5, label: 'V', accessibleLabel: 'Viernes' },
  { value: 6, label: 'S', accessibleLabel: 'Sábado' },
  { value: 7, label: 'D', accessibleLabel: 'Domingo' },
];
type Moment = TimeSlot | 'none' | 'exact';
const moments: { value: Moment; label: string }[] = [
  { value: 'none', label: 'Sin hora' },
  { value: 'morning', label: 'Mañana' },
  { value: 'afternoon', label: 'Tarde' },
  { value: 'night', label: 'Noche' },
  { value: 'exact', label: 'Hora exacta' },
];

interface ScheduleFieldsProps {
  value: HabitInput;
  intervalText: string;
  errors: { weekdays?: string; intervalDays?: string; timeOfDay?: string };
  disabled: boolean;
  onChange: (changes: Partial<HabitInput>) => void;
  onIntervalChange: (value: string) => void;
}

function getMoment(value: HabitInput): Moment {
  if (value.timeOfDay !== null) {
    return 'exact';
  }
  return value.timeSlot ?? 'none';
}

export function ScheduleFields({
  value,
  intervalText,
  errors,
  disabled,
  onChange,
  onIntervalChange,
}: ScheduleFieldsProps) {
  const moment = getMoment(value);
  function chooseWeekday(weekday: IsoWeekday): void {
    let selectedDays: IsoWeekday[];
    if (value.weekdays.includes(weekday)) {
      selectedDays = value.weekdays.filter((selected) => selected !== weekday);
    } else {
      selectedDays = [...value.weekdays, weekday];
    }
    selectedDays.sort();
    onChange({ weekdays: selectedDays });
  }
  function chooseMoment(selected: Moment): void {
    if (selected === 'exact') {
      onChange({ timeOfDay: '09:00', timeSlot: null });
      return;
    }
    const timeSlot = selected === 'none' ? null : selected;
    onChange({ timeOfDay: null, timeSlot });
  }
  return (
    <View className="gap-5">
      <ChoiceGroup
        label="Frecuencia"
        choices={frequencies}
        selected={[value.frequency]}
        disabled={disabled}
        onChoose={(frequency) => onChange({ frequency })}
      />
      {value.frequency === 'weekdays' ? (
        <View className="gap-2">
          <ChoiceGroup
            label="Días"
            choices={weekdays}
            selected={value.weekdays}
            multiple
            disabled={disabled}
            onChoose={chooseWeekday}
          />
          {errors.weekdays ? <Text role="alert">{errors.weekdays}</Text> : null}
        </View>
      ) : null}
      {value.frequency === 'every_n_days' ? (
        <TextField
          label="Cada cuántos días"
          value={intervalText}
          onChangeText={onIntervalChange}
          keyboardType="number-pad"
          editable={!disabled}
          error={errors.intervalDays}
        />
      ) : null}
      {value.frequency === 'monthly' ? (
        <Text variant="callout" className="text-muted-foreground">
          Se repite el día del mes de la fecha de inicio; si no existe, el
          último día del mes.
        </Text>
      ) : null}
      <ChoiceGroup
        label="Cuándo"
        choices={moments}
        selected={[moment]}
        disabled={disabled}
        onChoose={chooseMoment}
      />
      {moment === 'exact' ? (
        <TimeField
          label="Hora"
          value={value.timeOfDay ?? '09:00'}
          onChange={(timeOfDay) => onChange({ timeOfDay })}
        />
      ) : null}
      {errors.timeOfDay ? <Text role="alert">{errors.timeOfDay}</Text> : null}
    </View>
  );
}

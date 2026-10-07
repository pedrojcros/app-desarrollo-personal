import { View } from 'react-native';

import { DateField, TimeField } from '@/components/date-field';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import type { CalendarDate } from '@/domain/types';

import { DEFAULT_DUE_TIME, type TaskFormValues } from './task-form-values';

type DueDateFieldsProps = {
  dueDate: CalendarDate | null;
  dueTime: string | null;
  today: CalendarDate;
  onChange: (changes: Partial<TaskFormValues>) => void;
};

function NoDateChoice({
  today,
  onChange,
}: Omit<DueDateFieldsProps, 'dueDate' | 'dueTime'>) {
  return (
    <View className="gap-1.5">
      <Text variant="callout" weight="semibold">
        Fecha
      </Text>
      <Text variant="caption">Sin fecha</Text>
      <Button
        variant="secondary"
        accessibilityLabel="Añadir fecha"
        onPress={() => onChange({ dueDate: today })}
        className="self-start"
      >
        <Text>Añadir fecha</Text>
      </Button>
    </View>
  );
}

type DueTimeFieldProps = {
  dueTime: string | null;
  onChange: (changes: Partial<TaskFormValues>) => void;
};

function DueTimeField({ dueTime, onChange }: DueTimeFieldProps) {
  if (dueTime === null) {
    return (
      <Button
        variant="secondary"
        accessibilityLabel="Añadir hora"
        onPress={() => onChange({ dueTime: DEFAULT_DUE_TIME })}
        className="self-start"
      >
        <Text>Añadir hora</Text>
      </Button>
    );
  }
  return (
    <View className="gap-2">
      <TimeField
        label="Hora"
        value={dueTime}
        onChange={(time) => onChange({ dueTime: time })}
      />
      <Button
        variant="ghost"
        accessibilityLabel="Quitar hora"
        onPress={() => onChange({ dueTime: null })}
        className="self-start"
      >
        <Text>Quitar hora</Text>
      </Button>
    </View>
  );
}

/** La hora solo existe con fecha (RN-13): sin fecha no se ofrece. */
export function DueDateFields({
  dueDate,
  dueTime,
  today,
  onChange,
}: DueDateFieldsProps) {
  if (dueDate === null) {
    return <NoDateChoice today={today} onChange={onChange} />;
  }
  return (
    <View className="gap-3">
      <DateField
        label="Fecha"
        value={dueDate}
        onChange={(date) => onChange({ dueDate: date })}
      />
      <Button
        variant="ghost"
        accessibilityLabel="Sin fecha"
        onPress={() => onChange({ dueDate: null, dueTime: null })}
        className="self-start"
      >
        <Text>Sin fecha</Text>
      </Button>
      <DueTimeField dueTime={dueTime} onChange={onChange} />
    </View>
  );
}

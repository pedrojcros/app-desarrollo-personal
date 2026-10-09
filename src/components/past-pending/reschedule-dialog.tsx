import { useState } from 'react';
import { View } from 'react-native';

import { useCancelOnDismissKey } from '@/components/confirm-dialog/confirm-dialog';
import { DateField } from '@/components/date-field';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { addDays, compareCalendarDates } from '@/domain/calendar-date';
import type { CalendarDate } from '@/domain/types';
import { useTheme } from '@/theme/theme-context';

const PAST_DATE_MESSAGE = 'La nueva fecha debe ser hoy o posterior.';

type RescheduleDialogProps = {
  taskName: string;
  today: CalendarDate;
  // Fallo del guardado, que conoce quien guarda.
  errorMessage?: string;
  isSaving?: boolean;
  onSave: (newDueDate: CalendarDate) => void;
  onCancel: () => void;
};

function isBefore(date: CalendarDate, other: CalendarDate): boolean {
  return compareCalendarDates(date, other) < 0;
}

// Capa dentro de la propia pantalla, como ConfirmDialog: se monta solo mientras
// está abierta, así que cada apertura empieza con la fecha de mañana y sin errores.
export function RescheduleDialog({
  taskName,
  today,
  errorMessage,
  isSaving,
  onSave,
  onCancel,
}: RescheduleDialogProps) {
  const { shape, colors } = useTheme();
  const tomorrow = addDays(today, 1);
  const [selectedDate, setSelectedDate] = useState<CalendarDate>(tomorrow);
  const [isDateRefused, setIsDateRefused] = useState(false);
  useCancelOnDismissKey(true, onCancel);

  function chooseDate(date: CalendarDate): void {
    setSelectedDate(date);
    setIsDateRefused(false);
  }

  function save(): void {
    if (isBefore(selectedDate, today)) {
      setIsDateRefused(true);
      return;
    }
    onSave(selectedDate);
  }

  const panelStyle = {
    borderRadius: shape.floatingRadius,
    borderWidth: Math.max(shape.outlineWidth, 1),
    borderColor: colors.border,
    boxShadow: shape.smallShadow,
  };
  const visibleError = isDateRefused ? PAST_DATE_MESSAGE : errorMessage;

  return (
    <View className="absolute inset-0 z-10 items-center justify-center bg-inverse/60 px-4">
      <View
        role="alertdialog"
        aria-modal
        accessibilityViewIsModal
        accessibilityLabel={`Reprogramar ${taskName}`}
        className="w-full max-w-sm gap-3 bg-surface p-5"
        style={panelStyle}
      >
        <Text variant="headline">Reprogramar</Text>
        <Text>{taskName}</Text>
        <View className="flex-row gap-2">
          <Button
            size="small"
            variant={selectedDate === today ? 'primary' : 'secondary'}
            accessibilityLabel="Hoy"
            onPress={() => chooseDate(today)}
          >
            <Text>Hoy</Text>
          </Button>
          <Button
            size="small"
            variant={selectedDate === tomorrow ? 'primary' : 'secondary'}
            accessibilityLabel="Mañana"
            onPress={() => chooseDate(tomorrow)}
          >
            <Text>Mañana</Text>
          </Button>
        </View>
        <DateField
          label="Nueva fecha"
          value={selectedDate}
          minimumDate={today}
          onChange={chooseDate}
        />
        {visibleError ? (
          <Text accessibilityRole="alert" selectable>
            {visibleError}
          </Text>
        ) : null}
        <View className="mt-2 flex-row justify-end gap-2">
          <Button variant="secondary" onPress={onCancel}>
            <Text>Cancelar</Text>
          </Button>
          <Button disabled={isSaving} onPress={save}>
            <Text>Guardar</Text>
          </Button>
        </View>
      </View>
    </View>
  );
}

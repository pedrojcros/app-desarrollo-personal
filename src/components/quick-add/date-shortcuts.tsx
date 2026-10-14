import { useState } from 'react';
import { View } from 'react-native';
import { DateField } from '@/components/date-field';
import { formatFullDate } from '@/components/date-field/format';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import {
  getQuickAddShortcutDate,
  type QuickAddDateShortcut,
} from '@/domain/quick-add';
import type { CalendarDate } from '@/domain/types';
import { useTheme } from '@/theme/theme-context';

const shortcuts: { value: QuickAddDateShortcut; label: string }[] = [
  { value: 'none', label: 'Sin fecha' },
  { value: 'today', label: 'Hoy' },
  { value: 'tomorrow', label: 'Mañana' },
  { value: 'monday', label: 'Lunes' },
];
function describeDate(date: CalendarDate | null): string {
  if (date === null) {
    return 'Sin fecha';
  }
  return formatFullDate(date);
}

export function DateShortcuts({
  value,
  today,
  isHabit,
  disabled,
  onChange,
  onOpenChange,
}: {
  value: CalendarDate | null;
  today: CalendarDate;
  isHabit: boolean;
  disabled: boolean;
  onOpenChange(isOpen: boolean): void;
  onChange(date: CalendarDate | null): void;
}) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  function changeCalendarOpen(nextIsOpen: boolean): void {
    onOpenChange(nextIsOpen);
    setCalendarOpen(nextIsOpen);
  }
  const { colors, shape } = useTheme();
  const availableShortcuts = shortcuts.filter(
    (shortcut) => !isHabit || shortcut.value !== 'none',
  );
  return (
    <View className="relative z-20">
      <View className="flex-row flex-wrap gap-1">
        {availableShortcuts.map((shortcut) => {
          const date = getQuickAddShortcutDate(shortcut.value, today);
          const selected = date === value;
          return (
            <Button
              key={shortcut.value}
              size="small"
              variant={selected ? 'primary' : 'secondary'}
              accessibilityLabel={`Fecha: ${shortcut.label}`}
              disabled={disabled}
              onPress={() => onChange(date)}
            >
              <Text>{shortcut.label}</Text>
            </Button>
          );
        })}
        <Button
          size="small"
          variant="secondary"
          accessibilityLabel="Calendario"
          aria-expanded={calendarOpen}
          disabled={disabled}
          onPress={() => changeCalendarOpen(!calendarOpen)}
        >
          <Text>Calendario</Text>
        </Button>
      </View>
      <Text variant="caption" className="text-muted-foreground">
        {describeDate(value)}
      </Text>
      {calendarOpen ? (
        <View
          className="absolute bottom-full mb-2 w-full bg-surface p-3"
          style={{
            borderColor: colors.border,
            borderWidth: Math.max(shape.outlineWidth, 1),
            borderRadius: shape.controlRadius,
          }}
        >
          <DateField
            label={isHabit ? 'Fecha de inicio' : 'Fecha'}
            value={value ?? today}
            minimumDate={isHabit ? today : undefined}
            onChange={(date) => {
              onChange(date);
              changeCalendarOpen(false);
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

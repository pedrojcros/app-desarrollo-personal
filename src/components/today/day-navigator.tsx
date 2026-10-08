import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { View } from 'react-native';

import { DateField } from '@/components/date-field';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { addDays } from '@/domain/calendar-date';
import type { CalendarDate } from '@/domain/types';

type DayNavigatorProps = {
  date: CalendarDate;
  today: CalendarDate;
  onSelectDate: (date: CalendarDate) => void;
};

/** Flechas de día anterior y siguiente, selector de fecha y «Volver a hoy». */
export function DayNavigator({ date, today, onSelectDate }: DayNavigatorProps) {
  const isToday = date === today;

  return (
    <View className="gap-2 pt-2">
      <View className="flex-row items-end gap-2">
        <Button
          variant="secondary"
          size="icon"
          accessibilityLabel="Día anterior"
          onPress={() => onSelectDate(addDays(date, -1))}
        >
          <Icon icon={ChevronLeft} />
        </Button>
        <View className="flex-1">
          <DateField
            label="Ir a otro día"
            value={date}
            onChange={onSelectDate}
          />
        </View>
        <Button
          variant="secondary"
          size="icon"
          accessibilityLabel="Día siguiente"
          onPress={() => onSelectDate(addDays(date, 1))}
        >
          <Icon icon={ChevronRight} />
        </Button>
      </View>
      {isToday ? null : (
        <Button
          variant="ghost"
          size="small"
          className="self-start"
          onPress={() => onSelectDate(today)}
        >
          <Text>Volver a hoy</Text>
        </Button>
      )}
    </View>
  );
}

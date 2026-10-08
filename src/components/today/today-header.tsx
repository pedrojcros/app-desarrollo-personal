import { View } from 'react-native';

import { DayProgress, type DayOutcome } from '@/components/ui/day-progress';
import { Text } from '@/components/ui/text';
import type { ViewItem } from '@/domain/items';
import type { CalendarDate } from '@/domain/types';
import { formatLongDate, getDayTitle } from '@/domain/views/today';

import { DayNavigator } from './day-navigator';

type TodayHeaderProps = {
  date: CalendarDate;
  today: CalendarDate;
  total: number;
  marked: ViewItem[];
  onSelectDate: (date: CalendarDate) => void;
};

function toOutcome(item: ViewItem): DayOutcome {
  return item.status === 'done' ? 'done' : 'not-done';
}

export function TodayHeader({
  date,
  today,
  total,
  marked,
  onSelectDate,
}: TodayHeaderProps) {
  const outcomes = marked.map(toOutcome);

  return (
    <View>
      <DayNavigator date={date} today={today} onSelectDate={onSelectDate} />
      <View className="flex-row flex-wrap items-end justify-between gap-3 pb-3 pt-3">
        <View>
          <Text variant="caption">{formatLongDate(date)}</Text>
          <Text variant="title">{getDayTitle(date, today)}</Text>
        </View>
        <DayProgress outcomes={outcomes} total={total} />
      </View>
    </View>
  );
}

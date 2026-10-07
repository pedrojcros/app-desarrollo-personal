import { View } from 'react-native';

import { DayProgress, type DayOutcome } from '@/components/ui/day-progress';
import { Text } from '@/components/ui/text';
import { formatLongDate } from '@/domain/views/today';
import type { ViewItem } from '@/domain/items';

type TodayHeaderProps = {
  today: string;
  total: number;
  marked: ViewItem[];
};

function toOutcome(item: ViewItem): DayOutcome {
  return item.status === 'done' ? 'done' : 'not-done';
}

export function TodayHeader({ today, total, marked }: TodayHeaderProps) {
  const outcomes = marked.map(toOutcome);

  return (
    <View className="flex-row flex-wrap items-end justify-between gap-3 pb-3 pt-2">
      <View>
        <Text variant="caption">{formatLongDate(today)}</Text>
        <Text variant="title">Hoy</Text>
      </View>
      <DayProgress outcomes={outcomes} total={total} />
    </View>
  );
}

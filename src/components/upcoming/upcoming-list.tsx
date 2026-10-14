import { FlatList, View } from 'react-native';

import {
  describeItemMeta,
  getItemDetailPath,
} from '@/components/today/item-meta';
import { ListRow } from '@/components/ui/list-row';
import { Text } from '@/components/ui/text';
import type { Category } from '@/data/categories';
import { getMarkTargetKey } from '@/domain/items';
import type { CalendarDate } from '@/domain/types';
import { formatWeekTitle, type UpcomingWeek } from '@/domain/views/upcoming';

function formatDayTitle(date: CalendarDate): string {
  // UTC permite dar formato al día de calendario sin desplazarlo por la zona.
  const instant = new Date(`${date}T12:00:00Z`);
  const weekdayFormatter = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    timeZone: 'UTC',
  });
  const weekday = weekdayFormatter.format(instant);
  const firstLetter = weekday.charAt(0);
  const capitalizedFirstLetter = firstLetter.toUpperCase();
  const remainingLetters = weekday.slice(1);
  const capitalizedWeekday = capitalizedFirstLetter + remainingLetters;
  const dayText = date.slice(8);
  const dayNumber = Number(dayText);
  return `${capitalizedWeekday} ${dayNumber}`;
}

type UpcomingListProps = {
  weeks: UpcomingWeek[];
  categories: Category[];
  onOpen: (path: string) => void;
};

type UpcomingDaySectionProps = Pick<
  UpcomingListProps,
  'categories' | 'onOpen'
> & {
  day: UpcomingWeek['days'][number];
};

export function UpcomingDaySection({
  day,
  categories,
  onOpen,
}: UpcomingDaySectionProps) {
  return (
    <View className="pb-2">
      <Text weight="semibold" accessibilityRole="header" className="pb-1 pt-2">
        {formatDayTitle(day.date)}
      </Text>
      {day.items.map((item) => {
        const category = categories.find(
          (candidate) => candidate.id === item.categoryId,
        );
        const labelParts = [
          item.name,
          formatDayTitle(day.date),
          item.sortTime,
          category?.name,
          'abre la ficha',
        ];
        const accessibleLabel = labelParts
          .filter((part) => part !== null && part !== undefined)
          .join(', ');

        return (
          <ListRow
            key={getMarkTargetKey(item.target)}
            readOnly
            title={item.name}
            meta={describeItemMeta(item, category?.name)}
            category={category?.color}
            accessibilityLabel={accessibleLabel}
            onPress={() => onOpen(getItemDetailPath(item))}
          />
        );
      })}
    </View>
  );
}

type UpcomingWeekSectionProps = Omit<UpcomingListProps, 'weeks'> & {
  week: UpcomingWeek;
};

export function UpcomingWeekSection({
  week,
  categories,
  onOpen,
}: UpcomingWeekSectionProps) {
  return (
    <View className="pb-6">
      <Text variant="headline" accessibilityRole="header" className="pb-3 pt-4">
        {formatWeekTitle(week)}
      </Text>
      {week.days.length === 0 ? (
        <Text className="py-3 text-muted-foreground">Semana libre</Text>
      ) : null}
      {week.days.map((day) => (
        <UpcomingDaySection
          key={day.date}
          day={day}
          categories={categories}
          onOpen={onOpen}
        />
      ))}
    </View>
  );
}

export function UpcomingList({ weeks, categories, onOpen }: UpcomingListProps) {
  return (
    <FlatList
      data={weeks}
      keyExtractor={(week) => week.weekStart}
      renderItem={({ item }) => (
        <UpcomingWeekSection
          week={item}
          categories={categories}
          onOpen={onOpen}
        />
      )}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="pb-8"
    />
  );
}

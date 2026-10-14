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

export function UpcomingWeekSection({
  week,
  categories,
  onOpen,
}: Omit<UpcomingListProps, 'weeks'> & { week: UpcomingWeek }) {
  return (
    <View className="pb-6">
      <Text variant="headline" accessibilityRole="header" className="pb-3 pt-4">
        {formatWeekTitle(week)}
      </Text>
      {week.days.length === 0 ? (
        <Text className="py-3 text-muted-foreground">Semana libre</Text>
      ) : null}
      {week.days.map((day) => {
        const dayTitle = formatDayTitle(day.date);
        return (
          <View key={day.date} className="pb-2">
            <Text
              weight="semibold"
              accessibilityRole="header"
              className="pb-1 pt-2"
            >
              {dayTitle}
            </Text>
            {day.items.map((item) => {
              const category = categories.find(
                (candidate) => candidate.id === item.categoryId,
              );
              return (
                <ListRow
                  key={getMarkTargetKey(item.target)}
                  readOnly
                  title={item.name}
                  meta={describeItemMeta(item, category?.name)}
                  category={category?.color}
                  accessibilityLabel={`${item.name}, ${dayTitle}, abre la ficha`}
                  onPress={() => onOpen(getItemDetailPath(item))}
                />
              );
            })}
          </View>
        );
      })}
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

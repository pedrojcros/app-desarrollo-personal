import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { DayNavigator } from '@/components/today/day-navigator';
import { MarkedSection } from '@/components/today/marked-section';
import { TodayHeader } from '@/components/today/today-header';
import { TodayList } from '@/components/today/today-list';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useCategories } from '@/data/categories';
import { useMarkItem } from '@/data/marks';
import { useTodayView } from '@/data/today';
import { useToday } from '@/data/use-today';
import type { CalendarDate } from '@/domain/types';
import {
  canMarkDay,
  getMarkedSectionTitle,
  summarizeDay,
} from '@/domain/views/today';

function getEmptyMessage(isToday: boolean, hasItems: boolean): string {
  if (hasItems) {
    return isToday ? 'Todo hecho por hoy.' : 'Todo hecho ese día.';
  }
  return isToday
    ? 'Hoy no tienes nada. Día libre.'
    : 'Ese día no tienes nada. Día libre.';
}

export default function TodayScreen() {
  const router = useRouter();
  const today = useToday();
  // Sin día elegido se sigue «hoy», también al pasar la medianoche.
  const [chosenDate, setChosenDate] = useState<CalendarDate | null>(null);
  const date = chosenDate ?? today;
  const dayQuery = useTodayView(date);
  const categoriesQuery = useCategories();
  const { markItem } = useMarkItem();

  function selectDate(nextDate: CalendarDate): void {
    setChosenDate(nextDate === today ? null : nextDate);
  }

  const navigator = (
    <DayNavigator date={date} today={today} onSelectDate={selectDate} />
  );

  if (dayQuery.isPending) {
    return (
      <View className="flex-1 bg-background px-4">
        {navigator}
        <Text className="py-6 text-center">Cargando…</Text>
      </View>
    );
  }
  if (dayQuery.isError) {
    return (
      <View className="flex-1 gap-3 bg-background px-4">
        {navigator}
        <View className="items-center gap-3 py-6">
          <Text>No se pudo cargar el día.</Text>
          <Button variant="secondary" onPress={() => dayQuery.refetch()}>
            <Text>Reintentar</Text>
          </Button>
        </View>
      </View>
    );
  }

  const isToday = date === today;
  const items = dayQuery.data.items;
  const summary = summarizeDay(items);
  const pendingItems = items.filter((item) => item.status === 'pending');
  const emptyMessage = getEmptyMessage(isToday, items.length > 0);
  const categories = categoriesQuery.data ?? [];
  const canMark = canMarkDay(date, today);

  function openDetail(path: string): void {
    router.push(path as Href);
  }

  return (
    <View className="flex-1 bg-background">
      <TodayList
        pendingItems={pendingItems}
        categories={categories}
        emptyMessage={emptyMessage}
        canMark={canMark}
        header={
          <TodayHeader
            date={date}
            today={today}
            total={summary.total}
            marked={summary.marked}
            onSelectDate={selectDate}
          />
        }
        footer={
          <MarkedSection
            title={getMarkedSectionTitle(date, today)}
            markedItems={summary.marked}
            categories={categories}
            canMark={canMark}
            onMark={markItem}
            onOpen={openDetail}
          />
        }
        onMark={markItem}
        onOpen={openDetail}
      />
    </View>
  );
}

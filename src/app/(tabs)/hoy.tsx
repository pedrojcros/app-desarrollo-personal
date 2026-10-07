import { useRouter, type Href } from 'expo-router';
import { View } from 'react-native';

import { TodayHeader } from '@/components/today/today-header';
import { TodayList } from '@/components/today/today-list';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useCategories } from '@/data/categories';
import { useMarkItem } from '@/data/marks';
import { useTodayView } from '@/data/today';
import { useToday } from '@/data/use-today';
import { summarizeDay } from '@/domain/views/today';

const NOTHING_TODAY_MESSAGE = 'Hoy no tienes nada. Día libre.';
const ALL_DONE_MESSAGE = 'Todo hecho por hoy.';

export default function TodayScreen() {
  const router = useRouter();
  const today = useToday();
  const todayQuery = useTodayView(today);
  const categoriesQuery = useCategories();
  const { markItem } = useMarkItem();

  if (todayQuery.isPending) {
    return (
      <View className="flex-1 bg-background p-4">
        <Text className="py-6 text-center">Cargando Hoy…</Text>
      </View>
    );
  }
  if (todayQuery.isError) {
    return (
      <View className="flex-1 items-center gap-3 bg-background p-4 py-6">
        <Text>No se pudo cargar Hoy.</Text>
        <Button variant="secondary" onPress={() => todayQuery.refetch()}>
          <Text>Reintentar</Text>
        </Button>
      </View>
    );
  }

  const items = todayQuery.data.items;
  const summary = summarizeDay(items);
  const pendingItems = items.filter((item) => item.status === 'pending');
  const emptyMessage =
    items.length === 0 ? NOTHING_TODAY_MESSAGE : ALL_DONE_MESSAGE;
  const categories = categoriesQuery.data ?? [];

  function openDetail(path: string): void {
    router.push(path as Href);
  }

  return (
    <View className="flex-1 bg-background">
      <TodayList
        pendingItems={pendingItems}
        categories={categories}
        emptyMessage={emptyMessage}
        header={
          <TodayHeader
            today={today}
            total={summary.total}
            marked={summary.marked}
          />
        }
        onMark={markItem}
        onOpen={openDetail}
      />
    </View>
  );
}

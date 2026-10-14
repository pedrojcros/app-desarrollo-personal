import { useRouter, type Href } from 'expo-router';
import { View } from 'react-native';

import { MarkedSection } from '@/components/today/marked-section';
import { TodayHeader } from '@/components/today/today-header';
import { TodayList } from '@/components/today/today-list';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useCategories } from '@/data/categories';
import { useMarkItem } from '@/data/marks';
import { useTodayView } from '@/data/today';
import { useToday } from '@/data/use-today';
import { canMarkDay, summarizeDay } from '@/domain/views/today';

function getEmptyMessage(hasItems: boolean): string {
  if (hasItems) {
    return 'Todo hecho por hoy.';
  }
  return 'Hoy no tienes nada. Día libre.';
}

export default function TodayScreen() {
  const router = useRouter();
  const today = useToday();
  const dayQuery = useTodayView(today);
  const categoriesQuery = useCategories();
  const { markItem } = useMarkItem();

  if (dayQuery.isPending) {
    return (
      <View className="flex-1 bg-background px-4">
        <Text className="py-6 text-center">Cargando…</Text>
      </View>
    );
  }
  if (dayQuery.isError) {
    return (
      <View className="flex-1 gap-3 bg-background px-4">
        <View className="items-center gap-3 py-6">
          <Text>No se pudo cargar el día.</Text>
          <Button variant="secondary" onPress={() => dayQuery.refetch()}>
            <Text>Reintentar</Text>
          </Button>
        </View>
      </View>
    );
  }

  const items = dayQuery.data.items;
  const summary = summarizeDay(items);
  const pendingItems = items.filter((item) => item.status === 'pending');
  const emptyMessage = getEmptyMessage(items.length > 0);
  const categories = categoriesQuery.data ?? [];
  const canMark = canMarkDay(today, today);

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
        header={<TodayHeader total={summary.total} marked={summary.marked} />}
        footer={
          <MarkedSection
            title="Marcadas hoy"
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

import { router } from 'expo-router';
import { SectionList, View } from 'react-native';

import { ListRow } from '@/components/ui/list-row';
import { SectionTitle } from '@/components/ui/section-title';
import { Text } from '@/components/ui/text';
import { useMarkItem } from '@/data/marks';
import { getMarkTargetKey, type ViewItem } from '@/domain/items';
import type { CalendarDate } from '@/domain/types';
import { describeDay, groupByDay } from '@/domain/views/past-pending';

type PastPendingListProps = {
  items: ViewItem[];
  today: CalendarDate;
};

function openItem(item: ViewItem): void {
  if (item.target.kind === 'task') {
    router.push({
      pathname: '/tareas/[id]',
      params: { id: item.target.taskId },
    });
    return;
  }
  router.push({
    pathname: '/habitos/[id]',
    params: { id: item.target.habitId },
  });
}

// El día ya está en la cabecera del grupo: aquí solo la hora y el tipo.
function describeItem(item: ViewItem): string {
  const kind = item.target.kind === 'task' ? 'Tarea' : 'Hábito';
  if (item.sortTime === null) {
    return kind;
  }
  return `${item.sortTime} · ${kind}`;
}

export function PastPendingList({ items, today }: PastPendingListProps) {
  const { markItem } = useMarkItem();
  // Lo marcado sigue en la caché (para poder deshacer), pero sale de la lista.
  const pendingItems = items.filter((item) => item.status === 'pending');
  const groups = groupByDay(pendingItems);
  const sections = groups.map((group) => ({
    key: group.date,
    title: describeDay(group.date, today),
    data: group.items,
  }));

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => getMarkTargetKey(item.target)}
      contentInsetAdjustmentBehavior="automatic"
      stickySectionHeadersEnabled={false}
      className="flex-1"
      ListEmptyComponent={<Text className="py-6">Todo al día.</Text>}
      renderSectionHeader={({ section }) => (
        <SectionTitle title={section.title} />
      )}
      renderItem={({ item }) => (
        <ListRow
          title={item.name}
          meta={describeItem(item)}
          onPress={() => openItem(item)}
          onMarkDone={() => markItem(item, 'done')}
          onMarkNotDone={() => markItem(item, 'not_done')}
        />
      )}
      ListFooterComponent={<View className="h-6" />}
    />
  );
}

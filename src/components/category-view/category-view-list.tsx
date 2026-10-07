import { router } from 'expo-router';
import { SectionList, View } from 'react-native';

import { ListRow } from '@/components/ui/list-row';
import { SectionTitle } from '@/components/ui/section-title';
import { Text } from '@/components/ui/text';
import { useMarkItem } from '@/data/marks';
import type { Section } from '@/data/sections';
import { getMarkTargetKey, type ViewItem } from '@/domain/items';
import { groupBySection } from '@/domain/views/category';
import type { CategoryColor } from '@/theme/category-colors';

type CategoryViewListProps = {
  items: ViewItem[];
  sections: Section[];
  color?: CategoryColor;
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

function describeItem(item: ViewItem): string {
  const date = item.date ?? 'Sin fecha';
  const kind = item.target.kind === 'task' ? 'Tarea' : 'Hábito';
  const details = [date];
  if (item.sortTime !== null) {
    details.push(item.sortTime);
  }
  details.push(kind);
  return details.join(' · ');
}

export function CategoryViewList({
  items,
  sections,
  color,
}: CategoryViewListProps) {
  const { markItem } = useMarkItem();
  // T07 conserva las marcas en caché para poder restaurarlas al pulsar Deshacer.
  const pendingItems = items.filter((item) => item.status === 'pending');
  const groups = groupBySection(pendingItems, sections);
  const listSections = groups.map((group) => {
    const section = sections.find(
      (candidate) => candidate.id === group.sectionId,
    );
    const title = section?.name ?? 'Sin sección';
    return { key: group.sectionId ?? 'unsectioned', title, data: group.items };
  });

  return (
    <SectionList
      sections={listSections}
      keyExtractor={(item) => getMarkTargetKey(item.target)}
      contentInsetAdjustmentBehavior="automatic"
      stickySectionHeadersEnabled={false}
      className="flex-1"
      ListEmptyComponent={
        <Text className="py-6">No hay nada pendiente aquí.</Text>
      }
      renderSectionHeader={({ section }) => {
        if (sections.length === 0) {
          return null;
        }
        return <SectionTitle title={section.title} />;
      }}
      renderItem={({ item }) => (
        <ListRow
          title={item.name}
          meta={describeItem(item)}
          category={color}
          onPress={() => openItem(item)}
          onMarkDone={() => markItem(item, 'done')}
          onMarkNotDone={() => markItem(item, 'not_done')}
        />
      )}
      ListFooterComponent={<View className="h-6" />}
    />
  );
}

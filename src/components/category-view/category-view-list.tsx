import { Plus } from 'lucide-react-native';
import { useQuickAdd } from '@/components/quick-add';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { getQuickAddDefaults } from '@/domain/quick-add';
import { useToday } from '@/data/use-today';
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
  categoryId?: string | null;
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
  categoryId = null,
}: CategoryViewListProps) {
  const { open } = useQuickAdd();
  const today = useToday();
  const { markItem } = useMarkItem();
  // T07 conserva las marcas en caché para poder restaurarlas al pulsar Deshacer.
  const pendingItems = items.filter((item) => item.status === 'pending');
  const groups = groupBySection(pendingItems, sections);
  const sortedSections = [...sections];
  sortedSections.sort((first, second) =>
    first.name.localeCompare(second.name, 'es'),
  );
  const listSections: {
    key: string;
    sectionId: string | null;
    title: string;
    data: ViewItem[];
  }[] = sortedSections.map((section) => {
    const group = groups.find(
      (candidate) => candidate.sectionId === section.id,
    );
    return {
      key: section.id,
      sectionId: section.id,
      title: section.name,
      data: group?.items ?? [],
    };
  });
  const unsectionedGroup = groups.find((group) => group.sectionId === null);
  if (unsectionedGroup !== undefined) {
    listSections.push({
      key: 'unsectioned',
      sectionId: null,
      title: 'Sin sección',
      data: unsectionedGroup.items,
    });
  }

  function addToSection(sectionId: string | null): void {
    if (categoryId === null || sectionId === null) {
      return;
    }
    const defaults = getQuickAddDefaults(
      { kind: 'section', categoryId, sectionId },
      today,
    );
    open(defaults);
  }

  return (
    <SectionList
      sections={listSections}
      keyExtractor={(item) => getMarkTargetKey(item.target)}
      contentInsetAdjustmentBehavior="automatic"
      stickySectionHeadersEnabled={false}
      className="flex-1"
      ListHeaderComponent={
        pendingItems.length === 0 ? (
          <Text className="py-6">No hay nada pendiente aquí.</Text>
        ) : null
      }
      renderSectionHeader={({ section }) => {
        if (sections.length === 0) {
          return null;
        }
        return (
          <View className="flex-row items-center gap-2">
            <View className="flex-1">
              <SectionTitle title={section.title} />
            </View>
            {categoryId !== null && section.sectionId !== null ? (
              <Button
                size="icon"
                variant="ghost"
                accessibilityLabel={`Añadir en ${section.title}`}
                onPress={() => addToSection(section.sectionId)}
              >
                <Icon icon={Plus} color="accent-text" />
              </Button>
            ) : null}
          </View>
        );
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

import { ChevronDown, ChevronRight, Undo2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ListRow } from '@/components/ui/list-row';
import { Text } from '@/components/ui/text';
import type { Category } from '@/data/categories';
import type { ItemStatus, ViewItem } from '@/domain/items';
import { getMarkTargetKey } from '@/domain/items';

import { describeItemMeta, getItemDetailPath } from './item-meta';

type MarkedSectionProps = {
  title: string;
  markedItems: ViewItem[];
  categories: Category[];
  canMark: boolean;
  onMark: (item: ViewItem, status: ItemStatus) => void;
  onOpen: (path: string) => void;
};

function describeStatus(item: ViewItem): string {
  return item.status === 'done' ? 'Hecho' : 'No hecho';
}

/** Apartado plegado por defecto con lo marcado del día (RF-09). */
export function MarkedSection({
  title,
  markedItems,
  categories,
  canMark,
  onMark,
  onOpen,
}: MarkedSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (markedItems.length === 0) {
    return null;
  }

  function renderRow(item: ViewItem) {
    const category = categories.find(
      (candidate) => candidate.id === item.categoryId,
    );
    const meta = describeItemMeta(item, category?.name);
    return (
      <ListRow
        key={getMarkTargetKey(item.target)}
        title={item.name}
        meta={`${describeStatus(item)} · ${meta}`}
        category={category?.color}
        markDisabled={!canMark}
        secondaryAction={{
          label: `Devolver ${item.name} a pendiente`,
          icon: Undo2,
          onPress: () => onMark(item, 'pending'),
        }}
        onMarkDone={() => onMark(item, 'done')}
        onMarkNotDone={() => onMark(item, 'not_done')}
        onPress={() => onOpen(getItemDetailPath(item))}
      />
    );
  }

  const toggleIcon = isExpanded ? ChevronDown : ChevronRight;
  const heading = `${title} (${markedItems.length})`;

  return (
    <View className="mt-6">
      <Pressable
        role="button"
        accessibilityLabel={heading}
        accessibilityState={{ expanded: isExpanded }}
        onPress={() => setIsExpanded(!isExpanded)}
        className="min-h-11 flex-row items-center gap-2"
      >
        <Icon icon={toggleIcon} color="muted-foreground" />
        <Text variant="label" weight="semibold">
          {heading}
        </Text>
      </Pressable>
      {isExpanded ? markedItems.map(renderRow) : null}
    </View>
  );
}

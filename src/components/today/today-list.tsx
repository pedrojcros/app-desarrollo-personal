import type { ReactElement } from 'react';
import { FlatList, View } from 'react-native';

import { ListRow } from '@/components/ui/list-row';
import { Text } from '@/components/ui/text';
import type { Category } from '@/data/categories';
import type { ItemStatus, ViewItem } from '@/domain/items';
import { getMarkTargetKey } from '@/domain/items';

import { describeItemMeta, getItemDetailPath } from './item-meta';

type TodayListProps = {
  pendingItems: ViewItem[];
  categories: Category[];
  emptyMessage: string;
  header: ReactElement;
  onMark: (item: ViewItem, status: ItemStatus) => void;
  onOpen: (path: string) => void;
};

export function TodayList({
  pendingItems,
  categories,
  emptyMessage,
  header,
  onMark,
  onOpen,
}: TodayListProps) {
  function renderItem({ item }: { item: ViewItem }) {
    const category = categories.find(
      (candidate) => candidate.id === item.categoryId,
    );
    return (
      <ListRow
        title={item.name}
        meta={describeItemMeta(item, category?.name)}
        category={category?.color}
        onMarkDone={() => onMark(item, 'done')}
        onMarkNotDone={() => onMark(item, 'not_done')}
        onPress={() => onOpen(getItemDetailPath(item))}
      />
    );
  }

  return (
    <FlatList
      data={pendingItems}
      keyExtractor={(item) => getMarkTargetKey(item.target)}
      renderItem={renderItem}
      contentInsetAdjustmentBehavior="automatic"
      ListHeaderComponent={header}
      ListEmptyComponent={
        <View className="py-6">
          <Text className="text-center">{emptyMessage}</Text>
        </View>
      }
      contentContainerClassName="px-4 pb-8"
    />
  );
}

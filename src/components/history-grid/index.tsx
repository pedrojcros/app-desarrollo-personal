import { memo, useCallback, useMemo } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { Text } from '@/components/ui/text';
import {
  formatAccessibleDate,
  formatShortDate,
} from '@/components/date-field/format';
import type {
  HistoryCell,
  HistoryGrid as HistoryGridData,
  HistoryRow,
} from '@/domain/views/history';
import type { CategoryColor } from '@/theme/category-colors';
import { useTheme } from '@/theme/theme-context';
import { minimumTouchSize } from '@/theme/tokens';

export interface HistoryCategory {
  id: string;
  color: CategoryColor;
}
interface HistoryGridProps {
  grid: HistoryGridData;
  categories?: HistoryCategory[];
  today: string;
  onCellPress: (row: HistoryRow, day: string) => void;
}
const cellLabels: Record<HistoryCell, string> = {
  done: 'hecha',
  not_done: 'no hecha',
  unmarked: 'sin marcar',
  pending: 'pendiente',
  empty: 'no tocaba',
};
const cellSymbols: Record<HistoryCell, string> = {
  done: '✓',
  not_done: '✗',
  unmarked: '—',
  pending: '○',
  empty: '',
};
const COLUMN_WIDTH = minimumTouchSize + minimumTouchSize / 2;
const NAME_WIDTH = minimumTouchSize * 3;
function dayKey(day: string): string {
  return day;
}
function getColumnLayout(
  data: ArrayLike<string> | null | undefined,
  index: number,
) {
  return { length: COLUMN_WIDTH, offset: COLUMN_WIDTH * index, index };
}
const HistoryColumn = memo(function HistoryColumn({
  day,
  index,
  grid,
  categoryColors,
  today,
  onCellPress,
}: {
  day: string;
  index: number;
  grid: HistoryGridData;
  categoryColors: ReadonlyMap<string, CategoryColor>;
  today: string;
  onCellPress: (row: HistoryRow, day: string) => void;
}) {
  const { colors } = useTheme();
  const dateLabel = formatAccessibleDate(day);
  const percentage = grid.dayPercentages[index];
  const percentageLabel =
    percentage === null ? 'sin actividades' : `${percentage}% hechas`;
  const percentageText = percentage === null ? '—' : `${percentage}%`;
  function getCellColor(row: HistoryRow, cell: HistoryCell): string {
    if (cell === 'not_done') {
      return colors['not-done'];
    }
    if (cell !== 'done') {
      return colors['muted-foreground'];
    }
    const categoryColor =
      row.categoryId === null ? undefined : categoryColors.get(row.categoryId);
    if (categoryColor === undefined) {
      return colors.foreground;
    }
    return colors[`category-${categoryColor}`];
  }
  return (
    <View style={{ width: COLUMN_WIDTH }}>
      <View className="h-12 items-center justify-center border-b border-border bg-raised">
        <Text variant="caption" weight="semibold">
          {formatShortDate(day)}
        </Text>
      </View>
      {grid.rows.map((row, rowIndex) => {
        const cell = row.cells[index];
        const label = `${row.name}, ${dateLabel}: ${cellLabels[cell]}`;
        const color = getCellColor(row, cell);
        const isDimmed = grid.dimmedCells[rowIndex][index];
        let cellClassName =
          'h-12 items-center justify-center border-b border-border';
        if (isDimmed) {
          cellClassName = `${cellClassName} opacity-40`;
        }
        if (cell === 'empty') {
          return (
            <View key={row.key} className={cellClassName} accessible={false} />
          );
        }
        const canCorrect = day <= today;
        if (!canCorrect) {
          return (
            <View
              key={row.key}
              accessible
              accessibilityRole="image"
              accessibilityLabel={label}
              className={cellClassName}
            >
              <Text variant="headline" style={{ color }}>
                {cellSymbols[cell]}
              </Text>
            </View>
          );
        }
        return (
          <Pressable
            key={row.key}
            role="button"
            accessibilityLabel={label}
            accessibilityHint="Cambiar el estado de esta actividad"
            onPress={() => onCellPress(row, day)}
            className={cellClassName}
          >
            <Text variant="headline" style={{ color }}>
              {cellSymbols[cell]}
            </Text>
          </Pressable>
        );
      })}
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={`${dateLabel}: ${percentageLabel}`}
        className="h-12 items-center justify-center bg-raised"
      >
        <Text variant="caption" weight="semibold">
          {percentageText}
        </Text>
      </View>
    </View>
  );
});

/** Se virtualizan días enteros: 366 × 50 no monta todas las celdas a la vez. */
export function HistoryGrid({
  grid,
  categories = [],
  today,
  onCellPress,
}: HistoryGridProps) {
  const categoryColors = useMemo(() => {
    const entries = categories.map(
      (category) => [category.id, category.color] as const,
    );
    return new Map(entries);
  }, [categories]);
  const renderColumn = useCallback(
    ({ item, index }: ListRenderItemInfo<string>) => (
      <HistoryColumn
        day={item}
        index={index}
        grid={grid}
        categoryColors={categoryColors}
        today={today}
        onCellPress={onCellPress}
      />
    ),
    [grid, categoryColors, today, onCellPress],
  );
  return (
    <View className="flex-1 gap-3">
      <ScrollView
        className="flex-1"
        contentContainerClassName="grow"
        nestedScrollEnabled
      >
        <View className="flex-row border border-border bg-surface">
          <View style={{ width: NAME_WIDTH }}>
            <View className="h-12 justify-center border-b border-border bg-raised px-2">
              <Text variant="caption" weight="semibold">
                Actividad
              </Text>
            </View>
            {grid.rows.map((row) => (
              <View
                key={row.key}
                className="h-12 justify-center border-b border-border px-2"
              >
                <Text variant="caption" weight="medium" numberOfLines={2}>
                  {row.name}
                </Text>
              </View>
            ))}
            <View className="h-12 justify-center bg-raised px-2">
              <Text variant="caption" weight="semibold">
                Hechas
              </Text>
            </View>
          </View>
          <FlatList
            horizontal
            data={grid.days}
            renderItem={renderColumn}
            keyExtractor={dayKey}
            getItemLayout={getColumnLayout}
            initialNumToRender={7}
            maxToRenderPerBatch={7}
            windowSize={3}
            className="flex-1"
            accessibilityLabel="Días del historial"
            extraData={grid}
          />
        </View>
      </ScrollView>
      <Text variant="caption" className="text-muted-foreground">
        ✓ Hecha · ✗ No hecha · — Sin marcar · ○ Pendiente
      </Text>
      <Text variant="caption" className="text-muted-foreground">
        Vacío: no tocaba. %: hechas sobre todo lo que tocaba ese día.
      </Text>
    </View>
  );
}

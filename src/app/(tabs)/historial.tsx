import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { DateField } from '@/components/date-field';
import { HistoryGrid } from '@/components/history-grid';
import { HistoryFiltersBar } from '@/components/history-grid/history-filters';
import { HistoryStatusMenu } from '@/components/history-grid/history-status-menu';
import { useHistoryRange } from '@/components/history-grid/use-history-range';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useCategories } from '@/data/categories';
import { useHistory } from '@/data/history';
import { useMarkItem } from '@/data/marks';
import { getDeviceTimeZone } from '@/data/time-zone';
import { useToday } from '@/data/use-today';
import {
  buildHistoryGrid,
  filterHistoryGrid,
  type HistoryCell,
  type HistoryFilters,
  type HistoryRow,
} from '@/domain/views/history';
import type { ViewItem } from '@/domain/items';

const initialFilters: HistoryFilters = {
  status: 'all',
  categoryId: 'all',
  itemKey: null,
};

function doesRowMatchHistoryItem(
  item: ViewItem,
  row: HistoryRow,
  day: string,
): boolean {
  if (row.kind === 'task') {
    return (
      item.target.kind === 'task' && row.key === `task:${item.target.taskId}`
    );
  }
  return (
    item.target.kind === 'occurrence' &&
    row.key === `habit:${item.target.habitId}` &&
    item.date === day
  );
}

export default function HistoryScreen() {
  const today = useToday();
  const { fromDate, toDate, rangeError, setFromDate, setToDate } =
    useHistoryRange(today);
  const history = useHistory(fromDate, toDate);
  const categories = useCategories();
  const { markItem } = useMarkItem();
  const [filters, setFilters] = useState(initialFilters);
  const [selectedCell, setSelectedCell] = useState<{
    item: ViewItem;
    cell: HistoryCell;
  } | null>(null);
  const readError = history.error ?? categories.error;
  const timeZone = getDeviceTimeZone();
  const completeGrid = useMemo(() => {
    if (history.data === undefined) {
      return null;
    }
    return buildHistoryGrid(
      history.data.items,
      fromDate,
      toDate,
      today,
      timeZone,
    );
  }, [history.data, fromDate, toDate, today, timeZone]);
  const grid = useMemo(() => {
    if (completeGrid === null) {
      return null;
    }
    return filterHistoryGrid(completeGrid, filters);
  }, [completeGrid, filters]);
  function retry() {
    void history.refetch();
    void categories.refetch();
  }
  function openCellMenu(row: HistoryRow, day: string) {
    if (history.data === undefined || grid === null) {
      return;
    }
    const originalItem = history.data.items.find((item) =>
      doesRowMatchHistoryItem(item, row, day),
    );
    if (originalItem === undefined) {
      return;
    }
    const cellIndex = grid.days.indexOf(day);
    const rowIndex = grid.rows.findIndex(
      (visibleRow) => visibleRow.key === row.key,
    );
    const cell = grid.rows[rowIndex]?.cells[cellIndex];
    if (cell === undefined || cell === 'empty') {
      return;
    }
    setSelectedCell({ item: originalItem, cell });
  }
  function selectCellStatus(status: 'pending' | 'done' | 'not_done') {
    if (selectedCell === null) {
      return;
    }
    markItem(selectedCell.item, status);
    setSelectedCell(null);
  }
  function renderContent() {
    if (grid === null || categories.data === undefined) {
      if (readError) {
        return null;
      }
      return (
        <Text accessibilityRole="text" className="text-muted-foreground">
          Cargando historial…
        </Text>
      );
    }
    const completeRows = completeGrid?.rows ?? [];
    return (
      <>
        <HistoryFiltersBar
          filters={filters}
          rows={completeRows}
          categories={categories.data}
          onChange={setFilters}
        />
        {grid.rows.length === 0 ? (
          <Text className="text-muted-foreground">
            {completeRows.length === 0
              ? 'No hay nada en estas fechas'
              : 'Nada con estos filtros.'}
          </Text>
        ) : (
          <HistoryGrid
            grid={grid}
            categories={categories.data}
            today={today}
            onCellPress={openCellMenu}
          />
        )}
        <HistoryStatusMenu
          visible={selectedCell !== null}
          currentCell={selectedCell?.cell ?? null}
          onClose={() => setSelectedCell(null)}
          onSelect={selectCellStatus}
        />
      </>
    );
  }
  return (
    <View className="flex-1 gap-4 bg-background p-4">
      <View className="gap-1">
        <Text variant="title" accessibilityRole="header">
          Historial
        </Text>
        <Text variant="caption" className="text-muted-foreground">
          Lo que has ido haciendo.
        </Text>
      </View>
      <View className="gap-3">
        <DateField
          label="Fecha inicial"
          value={fromDate}
          onChange={setFromDate}
          maximumDate={today}
        />
        <DateField
          label="Fecha final"
          value={toDate}
          onChange={setToDate}
          maximumDate={today}
        />
      </View>
      {rangeError !== null ? <Text role="alert">{rangeError}</Text> : null}
      {readError ? (
        <View className="gap-2" role="alert">
          <Text>No se ha podido cargar el historial. Inténtalo de nuevo.</Text>
          <Button
            variant="secondary"
            onPress={retry}
            accessibilityLabel="Reintentar"
          >
            <Text>Reintentar</Text>
          </Button>
        </View>
      ) : null}
      {renderContent()}
    </View>
  );
}

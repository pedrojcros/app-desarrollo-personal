import { useMemo } from 'react';
import { View } from 'react-native';
import { DateField } from '@/components/date-field';
import { HistoryGrid } from '@/components/history-grid';
import { useHistoryRange } from '@/components/history-grid/use-history-range';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useCategories } from '@/data/categories';
import { useHistory } from '@/data/history';
import { getDeviceTimeZone } from '@/data/time-zone';
import { useToday } from '@/data/use-today';
import { buildHistoryGrid } from '@/domain/views/history';

export default function HistoryScreen() {
  const today = useToday();
  const { fromDate, toDate, rangeError, setFromDate, setToDate } =
    useHistoryRange(today);
  const history = useHistory(fromDate, toDate);
  const categories = useCategories();
  const readError = history.error ?? categories.error;
  const timeZone = getDeviceTimeZone();
  const grid = useMemo(() => {
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
  function retry() {
    void history.refetch();
    void categories.refetch();
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
    if (grid.rows.length === 0) {
      return (
        <Text className="text-muted-foreground">
          No hay nada en estas fechas
        </Text>
      );
    }
    return <HistoryGrid grid={grid} categories={categories.data} />;
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

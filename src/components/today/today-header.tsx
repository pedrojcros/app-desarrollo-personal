import { StyleSheet, View } from 'react-native';

import { DayProgress, type DayOutcome } from '@/components/ui/day-progress';
import { Text } from '@/components/ui/text';
import type { ViewItem } from '@/domain/items';

type TodayHeaderProps = {
  total: number;
  marked: ViewItem[];
};

// Oculto a la vista pero presente para el lector de pantalla: un tamaño de un
// punto, sin opacidad, y no `display: none`, que también lo quitaría del lector.
const hiddenFromSight = StyleSheet.create({
  heading: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    opacity: 0,
  },
});

function toOutcome(item: ViewItem): DayOutcome {
  return item.status === 'done' ? 'done' : 'not-done';
}

export function TodayHeader({ total, marked }: TodayHeaderProps) {
  const outcomes = marked.map(toOutcome);

  return (
    <View className="items-end pb-2 pt-2">
      <Text accessibilityRole="header" style={hiddenFromSight.heading}>
        Hoy
      </Text>
      <DayProgress outcomes={outcomes} total={total} />
    </View>
  );
}

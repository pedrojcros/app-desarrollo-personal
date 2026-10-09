import { View } from 'react-native';

import { useTheme } from '@/theme/theme-context';

import { Text } from './text';

export type DayOutcome = 'done' | 'not-done';

type DayProgressProps = {
  // Lo marcado hasta ahora, en orden.
  outcomes: DayOutcome[];
  total: number;
};

function ProgressSquare({ outcome }: { outcome: DayOutcome | undefined }) {
  const { shape, colors } = useTheme();
  const hasOutline = shape.outlineWidth > 0;
  const fillColor = outcome ? colors[outcome] : 'transparent';
  const outlineColor = outcome && !hasOutline ? colors[outcome] : colors.border;
  const squareStyle = {
    borderRadius: hasOutline ? 0 : 3,
    borderWidth: 1.5,
    borderColor: outlineColor,
    backgroundColor: fillColor,
  };

  return <View className="h-2.5 w-2.5" style={squareStyle} />;
}

// El «2 de 8 marcadas» de arriba: en el tercer estilo es una etiqueta amarilla
// con borde y «marcadas» va debajo de los cuadritos.
function ProgressCount({
  markedCount,
  total,
}: {
  markedCount: number;
  total: number;
}) {
  const { shape } = useTheme();
  const hasOutline = shape.outlineWidth > 0;
  const countLabel = `${markedCount} de ${total}`;

  if (hasOutline) {
    return (
      <View
        className="border-[1.5px] border-border bg-accent px-1.5 py-0.5"
        style={{ boxShadow: shape.smallShadow }}
      >
        <Text
          variant="callout"
          weight="bold"
          className="text-accent-foreground"
        >
          {countLabel}
        </Text>
      </View>
    );
  }

  return (
    <Text variant="callout" weight="semibold" className="text-accent-text">
      {countLabel}{' '}
      <Text variant="callout" className="text-muted-foreground">
        marcadas
      </Text>
    </Text>
  );
}

// Un cuadrito por cada tarea del día: hecho, no hecho o vacío.
export function DayProgress({ outcomes, total }: DayProgressProps) {
  const { shape } = useTheme();
  const squareIndexes = Array.from({ length: total }, (_, index) => index);
  const showsCaptionBelow = shape.outlineWidth > 0;

  return (
    <View
      className="items-end gap-2"
      accessible
      accessibilityLabel={`${outcomes.length} de ${total} marcadas`}
    >
      <ProgressCount markedCount={outcomes.length} total={total} />
      <View className="flex-row gap-[3px]">
        {squareIndexes.map((squareIndex) => (
          <ProgressSquare key={squareIndex} outcome={outcomes[squareIndex]} />
        ))}
      </View>
      {showsCaptionBelow ? <Text variant="caption">marcadas</Text> : null}
    </View>
  );
}

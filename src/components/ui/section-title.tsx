import { View } from 'react-native';

import { Text } from './text';

type SectionTitleProps = { title: string; count?: string };

// Título de grupo de una lista («Sin hora», «Mañana»...), con su línea fina.
export function SectionTitle({ title, count }: SectionTitleProps) {
  return (
    <View className="mt-4 flex-row items-center gap-3">
      <Text variant="label" weight="semibold" accessibilityRole="header">
        {title}
      </Text>
      <View className="h-px flex-1 bg-border" />
      {count ? <Text variant="caption">{count}</Text> : null}
    </View>
  );
}

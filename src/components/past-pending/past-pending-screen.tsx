import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { usePastPending } from '@/data/past-pending';
import { useToday } from '@/data/use-today';

import { PastPendingList } from './past-pending-list';

function ReadError({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="gap-3 py-6">
      <Text accessibilityRole="alert" selectable>
        No se pudo cargar lo pendiente.
      </Text>
      <Button onPress={onRetry} className="self-start">
        <Text>Reintentar</Text>
      </Button>
    </View>
  );
}

function PastPendingContents() {
  const today = useToday();
  const pastPending = usePastPending(today);
  if (pastPending.isError) {
    return (
      <ReadError
        onRetry={() => {
          void pastPending.refetch();
        }}
      />
    );
  }
  if (pastPending.isPending) {
    return <Text className="py-6">Cargando pendientes…</Text>;
  }
  return <PastPendingList items={pastPending.data.items} today={today} />;
}

export function PastPendingScreen() {
  return (
    <View className="w-full max-w-3xl flex-1 self-center bg-background px-4">
      <PastPendingContents />
    </View>
  );
}

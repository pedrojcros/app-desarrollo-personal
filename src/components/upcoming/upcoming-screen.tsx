import { router, type Href } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useCategories } from '@/data/categories';
import { useUpcomingView } from '@/data/upcoming';
import { useToday } from '@/data/use-today';

import { UpcomingList } from './upcoming-list';

export function UpcomingScreen() {
  const today = useToday();
  const upcoming = useUpcomingView(today);
  const categories = useCategories();

  function retry() {
    void upcoming.refetch();
    void categories.refetch();
  }

  function renderContents() {
    if (upcoming.isError || categories.isError) {
      return (
        <View className="gap-3 py-6">
          <Text accessibilityRole="alert">No se pudo cargar lo próximo.</Text>
          <Button onPress={retry} className="self-start">
            <Text>Reintentar</Text>
          </Button>
        </View>
      );
    }
    if (upcoming.isPending || categories.isPending) {
      return <Text className="py-6">Cargando próximo…</Text>;
    }
    return (
      <UpcomingList
        weeks={upcoming.data}
        categories={categories.data ?? []}
        onOpen={(path) => router.push(path as Href)}
      />
    );
  }

  return (
    <View className="w-full max-w-3xl flex-1 self-center bg-background px-4">
      {renderContents()}
    </View>
  );
}

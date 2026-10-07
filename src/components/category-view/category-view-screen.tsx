import { View } from 'react-native';

import {
  CategoryIcon,
  getCategoryColorToken,
} from '@/components/category-icon';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useCategories, type Category } from '@/data/categories';
import { useCategoryView } from '@/data/category-view';
import { useToday } from '@/data/use-today';

import { CategoryViewList } from './category-view-list';

type CategoryViewScreenProps = { categoryId: string | null };

function ReadError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View className="gap-3 py-6">
      <Text accessibilityRole="alert" selectable>
        {message}
      </Text>
      <Button onPress={onRetry} className="self-start">
        <Text>Reintentar</Text>
      </Button>
    </View>
  );
}

function CategoryContents({
  categoryId,
  category,
}: CategoryViewScreenProps & { category?: Category }) {
  const today = useToday();
  const view = useCategoryView(categoryId, today);
  if (view.isError) {
    return (
      <ReadError
        message="No se pudo cargar lo pendiente."
        onRetry={() => {
          void view.refetch();
        }}
      />
    );
  }
  if (view.isPending) {
    return <Text className="py-6">Cargando pendientes…</Text>;
  }
  return (
    <CategoryViewList
      items={view.data.items}
      sections={category?.sections ?? []}
      color={category?.color}
    />
  );
}

function CategoryScreen({ categoryId }: { categoryId: string }) {
  const categories = useCategories();
  if (categories.isError) {
    return (
      <ReadError
        message="No se pudo cargar la categoría."
        onRetry={() => {
          void categories.refetch();
        }}
      />
    );
  }
  if (categories.isPending) {
    return <Text className="py-6">Cargando categoría…</Text>;
  }
  const category = categories.data.find(
    (candidate) => candidate.id === categoryId,
  );
  if (category === undefined) {
    return <Text className="py-6">Esta categoría ya no existe.</Text>;
  }
  return (
    <>
      <View className="flex-row items-center gap-3 py-4">
        <CategoryIcon
          name={category.icon}
          colorToken={getCategoryColorToken(category.color)}
        />
        <Text
          variant="heading"
          accessibilityRole="header"
          className="flex-1"
          selectable
        >
          {category.name}
        </Text>
      </View>
      <CategoryContents categoryId={categoryId} category={category} />
    </>
  );
}

export function CategoryViewScreen({ categoryId }: CategoryViewScreenProps) {
  return (
    <View className="w-full max-w-3xl flex-1 self-center bg-background px-4">
      {categoryId === null ? (
        <>
          <Text variant="heading" accessibilityRole="header" className="py-4">
            Bandeja de entrada
          </Text>
          <CategoryContents categoryId={null} />
        </>
      ) : (
        <CategoryScreen categoryId={categoryId} />
      )}
    </View>
  );
}

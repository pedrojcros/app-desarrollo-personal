import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { CategoryRow } from '@/components/category-list/category-row';
import { NewCategoryForm } from '@/components/category-list/new-category-form';
import { useDeleteRequest } from '@/components/category-list/use-delete-request';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useCategories, type Category } from '@/data/categories';

type CategoryListProps = {
  categories: Category[];
  onDeleteCategory: (category: Category) => void;
  onDeleteSection: Parameters<typeof CategoryRow>[0]['onDeleteSection'];
};

function CategoryList({
  categories,
  onDeleteCategory,
  onDeleteSection,
}: CategoryListProps) {
  if (categories.length === 0) {
    return <Text className="py-6 text-center">Aún no tienes categorías</Text>;
  }
  return (
    <View>
      {categories.map((category) => (
        <CategoryRow
          key={category.id}
          category={category}
          onDeleteCategory={onDeleteCategory}
          onDeleteSection={onDeleteSection}
        />
      ))}
    </View>
  );
}

export default function CategoriesScreen() {
  const [isCreating, setIsCreating] = useState(false);
  const categoriesQuery = useCategories();
  const deletion = useDeleteRequest();
  const request = deletion.request;

  function renderContent() {
    if (categoriesQuery.isPending) {
      return <Text className="py-6 text-center">Cargando categorías…</Text>;
    }
    if (categoriesQuery.isError) {
      return (
        <View className="items-center gap-3 py-6">
          <Text>No se pudieron cargar las categorías.</Text>
          <Button variant="secondary" onPress={() => categoriesQuery.refetch()}>
            <Text>Reintentar</Text>
          </Button>
        </View>
      );
    }
    return (
      <CategoryList
        categories={categoriesQuery.data}
        onDeleteCategory={deletion.requestCategoryDeletion}
        onDeleteSection={deletion.requestSectionDeletion}
      />
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-4 px-4 pb-8 pt-2">
        {isCreating ? (
          <NewCategoryForm onClose={() => setIsCreating(false)} />
        ) : (
          <Button
            variant="secondary"
            className="self-start gap-2"
            onPress={() => setIsCreating(true)}
          >
            <Icon icon={Plus} size={18} />
            <Text>Nueva categoría</Text>
          </Button>
        )}
        {deletion.errorMessage ? (
          <Text role="alert">{deletion.errorMessage}</Text>
        ) : null}
        {renderContent()}
      </ScrollView>
      <ConfirmDialog
        visible={request !== null}
        title={request?.title ?? ''}
        message={request?.message ?? ''}
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => request?.confirm()}
        onCancel={deletion.cancel}
      />
    </View>
  );
}

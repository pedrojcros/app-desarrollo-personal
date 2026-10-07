import { useLocalSearchParams } from 'expo-router';

import { CategoryViewScreen } from '@/components/category-view/category-view-screen';

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CategoryViewScreen categoryId={id} />;
}

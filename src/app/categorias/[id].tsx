import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QuickAddButton } from '@/components/quick-add';
import { getQuickAddDefaults } from '@/domain/quick-add';
import { useToday } from '@/data/use-today';
import { useLocalSearchParams } from 'expo-router';

import { CategoryViewScreen } from '@/components/category-view/category-view-screen';

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const today = useToday();
  const insets = useSafeAreaInsets();
  const defaults = getQuickAddDefaults(
    { kind: 'category', categoryId: id },
    today,
  );
  return (
    <View className="flex-1">
      <CategoryViewScreen categoryId={id} />
      <View className="absolute right-4 mb-4" style={{ bottom: insets.bottom }}>
        <QuickAddButton defaults={defaults} />
      </View>
    </View>
  );
}

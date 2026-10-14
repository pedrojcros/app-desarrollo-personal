import { router } from 'expo-router';
import { ChevronRight, Inbox } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useCategoryView } from '@/data/category-view';
import { useToday } from '@/data/use-today';

function describePendingCount(count: number): string {
  if (count === 0) {
    return 'Nada pendiente';
  }
  if (count === 1) {
    return '1 pendiente';
  }
  return `${count} pendientes`;
}

// La Bandeja no es una categoría: no se renombra ni se elimina, solo se abre.
export function InboxRow() {
  const today = useToday();
  const inboxView = useCategoryView(null, today);
  const pendingCount = inboxView.data?.items.length;

  return (
    <Pressable
      role="button"
      accessibilityLabel="Abrir Bandeja de entrada"
      onPress={() => router.push('/bandeja')}
      className="min-h-14 flex-row items-center gap-3 border-b border-border"
    >
      <Icon icon={Inbox} color="muted-foreground" size={22} />
      <View className="flex-1">
        <Text weight="semibold">Bandeja de entrada</Text>
        {pendingCount === undefined ? null : (
          <Text variant="caption">{describePendingCount(pendingCount)}</Text>
        )}
      </View>
      <Icon icon={ChevronRight} color="muted-foreground" size={18} />
    </Pressable>
  );
}

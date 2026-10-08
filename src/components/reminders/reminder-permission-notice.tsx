import { Linking, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import type { ReminderPermission } from '@/platform/notifications';

type ReminderPermissionNoticeProps = {
  permission: ReminderPermission | null;
  onAskPermission: () => void;
};

// Con el permiso concedido no dice nada: solo habla cuando falta algo.
export function ReminderPermissionNotice({
  permission,
  onAskPermission,
}: ReminderPermissionNoticeProps) {
  if (permission === 'undetermined') {
    return (
      <View className="mt-3">
        <Button
          variant="secondary"
          size="small"
          accessibilityRole="button"
          accessibilityLabel="Permitir avisos"
          onPress={onAskPermission}
        >
          <Text>Permitir avisos</Text>
        </Button>
      </View>
    );
  }

  if (permission === 'denied') {
    return (
      <View className="mt-3 gap-2">
        <Text variant="caption" role="alert" className="text-not-done">
          Los avisos están bloqueados en el móvil
        </Text>
        <Button
          variant="secondary"
          size="small"
          accessibilityRole="button"
          accessibilityLabel="Abrir ajustes del móvil"
          onPress={() => Linking.openSettings()}
        >
          <Text>Abrir ajustes del móvil</Text>
        </Button>
      </View>
    );
  }

  return null;
}

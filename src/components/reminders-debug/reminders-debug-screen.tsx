import { ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { SectionTitle } from '@/components/ui/section-title';
import { Text } from '@/components/ui/text';
import type { ReminderPermission } from '@/platform/notifications';

import { useReminderDebug } from './use-reminder-debug';

const PERMISSION_LABELS: Record<ReminderPermission, string> = {
  granted: 'concedido',
  denied: 'denegado',
  undetermined: 'sin decidir',
  unsupported: 'no disponible',
};

// Pantalla de desarrollo: enseña lo que el móvil tiene programado y deja
// probar los avisos sin esperar a que llegue su hora.
export default function RemindersDebugScreen() {
  const { isSupported, permission, reminders, message, syncNow, scheduleTest } =
    useReminderDebug();

  if (!isSupported) {
    return (
      <View className="flex-1 bg-background px-5 pt-4">
        <Text>No hay recordatorios en la web.</Text>
      </View>
    );
  }

  const permissionLabel =
    permission === null ? '…' : PERMISSION_LABELS[permission];

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-5 pb-10"
    >
      <SectionTitle title="Permiso" />
      <Text className="mt-2">Permiso de avisos: {permissionLabel}</Text>

      <View className="mt-4 gap-3">
        <Button onPress={syncNow}>
          <Text>Poner al día</Text>
        </Button>
        <Button variant="secondary" onPress={scheduleTest}>
          <Text>Probar en 10 segundos</Text>
        </Button>
      </View>
      {message === null ? null : (
        <Text variant="eyebrow" className="mt-2">
          {message}
        </Text>
      )}

      <SectionTitle title="Programados" count={String(reminders.length)} />
      {reminders.length === 0 ? (
        <Text className="mt-2">No hay avisos programados.</Text>
      ) : null}
      {reminders.map((reminder) => (
        <View key={reminder.key} className="mt-3">
          <Text weight="semibold">{reminder.title}</Text>
          <Text variant="caption">
            {reminder.date} {reminder.time}
          </Text>
          <Text variant="caption">{reminder.key}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

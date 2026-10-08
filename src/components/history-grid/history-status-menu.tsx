import { Modal, Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import type { HistoryCell } from '@/domain/views/history';
import type { ItemStatus } from '@/domain/items';

const statusOptions: { label: string; status: ItemStatus }[] = [
  { label: 'Hecha', status: 'done' },
  { label: 'No hecha', status: 'not_done' },
  { label: 'Sin marcar', status: 'pending' },
];

export function HistoryStatusMenu({
  visible,
  currentCell,
  onClose,
  onSelect,
}: {
  visible: boolean;
  currentCell: HistoryCell | null;
  onClose: () => void;
  onSelect: (status: ItemStatus) => void;
}) {
  let currentStatus: ItemStatus | null = null;
  if (currentCell === 'done' || currentCell === 'not_done') {
    currentStatus = currentCell;
  }
  if (currentCell === 'unmarked' || currentCell === 'pending') {
    currentStatus = 'pending';
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      accessibilityLabel="Cambiar estado"
    >
      <View className="flex-1 justify-end bg-inverse/40">
        <Pressable
          role="button"
          accessibilityLabel="Cerrar menú de estado"
          onPress={onClose}
          className="flex-1"
        />
        <View
          role="radiogroup"
          accessibilityLabel="Estado de la actividad"
          className="gap-2 rounded-t-2xl border border-border bg-surface p-4"
        >
          <Text variant="title">Cambiar estado</Text>
          {statusOptions.map((option) => {
            const isSelected = currentStatus === option.status;
            return (
              <Pressable
                key={option.status}
                role="radio"
                accessibilityLabel={option.label}
                aria-checked={isSelected}
                accessibilityState={{ checked: isSelected }}
                focusable
                onPress={() => onSelect(option.status)}
                className="min-h-11 justify-center rounded-lg border border-border px-3"
              >
                <Text weight={isSelected ? 'semibold' : 'regular'}>
                  {option.label}
                  {isSelected ? ' · Actual' : ''}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            role="button"
            accessibilityLabel="Cancelar"
            focusable
            onPress={onClose}
            className="min-h-11 items-center justify-center"
          >
            <Text>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

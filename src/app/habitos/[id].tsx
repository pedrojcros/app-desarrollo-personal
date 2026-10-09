import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { HabitForm } from '@/components/habit-form';
import { returnAfterHabitSave } from '@/components/habit-form/return-after-save';
import { habitToFormValue } from '@/components/habit-form/initial-value';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import {
  useArchiveHabit,
  useHabit,
  useUpdateHabit,
  type HabitInput,
} from '@/data/habits';
import { useToday } from '@/data/use-today';

export default function EditHabitScreen() {
  const parameters = useLocalSearchParams<{ id: string }>();
  const habitId = typeof parameters.id === 'string' ? parameters.id : '';
  const habitQuery = useHabit(habitId);
  const update = useUpdateHabit();
  const archive = useArchiveHabit();
  const today = useToday();
  const [confirming, setConfirming] = useState(false);
  const [archiveError, setArchiveError] = useState(false);
  const archiving = useRef(false);
  const habit = habitQuery.data;

  async function save(input: HabitInput): Promise<void> {
    await update.mutateAsync({
      habitId,
      changes: input,
      schedule: { startDate: input.startDate, today, rule: input },
    });
    returnAfterHabitSave();
  }

  async function confirmArchive(): Promise<void> {
    if (archiving.current) {
      return;
    }
    archiving.current = true;
    setConfirming(false);
    setArchiveError(false);
    try {
      await archive.mutateAsync(habitId);
      returnAfterHabitSave();
    } catch {
      setArchiveError(true);
    } finally {
      archiving.current = false;
    }
  }

  if (!habit) {
    if (habitQuery.error) {
      const message =
        habitQuery.error.code === 'not_found'
          ? 'No se encuentra este hábito.'
          : 'No se pudo cargar el hábito.';
      return (
        <View className="flex-1 gap-4 bg-background p-4">
          <Text role="alert">{message}</Text>
          <Button onPress={() => habitQuery.refetch()}>
            <Text>Reintentar</Text>
          </Button>
        </View>
      );
    }
    return (
      <View className="flex-1 bg-background p-4">
        <Text>Cargando hábito…</Text>
      </View>
    );
  }
  if (habit.archivedOn !== null) {
    return (
      <View className="flex-1 bg-background p-4">
        <Text>Este hábito está archivado. Su historial se conserva.</Text>
      </View>
    );
  }
  const initialValue = habitToFormValue(habit, today);
  if (!initialValue) {
    return (
      <View className="flex-1 gap-4 bg-background p-4">
        <Text role="alert">No se pudo cargar la frecuencia del hábito.</Text>
        <Button onPress={() => habitQuery.refetch()}>
          <Text>Reintentar</Text>
        </Button>
      </View>
    );
  }
  const pending = update.isPending || archive.isPending;
  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mx-auto w-full max-w-xl gap-5 p-4 pb-12">
          {habitQuery.error ? (
            <Text role="alert">
              No se pudo actualizar la información. Se muestran los últimos
              datos guardados.
            </Text>
          ) : null}
          <HabitForm
            mode="edit"
            initialValue={initialValue}
            onSubmit={save}
            isPending={pending}
          />
          {archiveError ? (
            <Text role="alert">No se pudo archivar. Inténtalo de nuevo.</Text>
          ) : null}
          <Button
            variant="secondary"
            disabled={pending}
            accessibilityLabel="Archivar hábito"
            onPress={() => setConfirming(true)}
          >
            <Text>Archivar hábito</Text>
          </Button>
        </View>
      </ScrollView>
      <ConfirmDialog
        visible={confirming}
        title="¿Archivar hábito?"
        message="Dejará de aparecer, pero su historial se conserva"
        confirmLabel="Archivar"
        destructive
        onConfirm={confirmArchive}
        onCancel={() => setConfirming(false)}
      />
    </View>
  );
}

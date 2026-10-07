import { useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { HabitForm } from '@/components/habit-form';
import { returnAfterHabitSave } from '@/components/habit-form/return-after-save';
import { readHabitRouteDefaults } from '@/components/habit-form/initial-value';
import { useCreateHabit, type HabitInput } from '@/data/habits';
import { useToday } from '@/data/use-today';

export default function NewHabitScreen() {
  const parameters = useLocalSearchParams<{
    categoryId?: string;
    sectionId?: string;
    startDate?: string;
  }>();
  const today = useToday();
  const mutation = useCreateHabit();
  const initialValue = readHabitRouteDefaults(parameters, today);

  async function save(input: HabitInput): Promise<void> {
    await mutation.mutateAsync(input);
    returnAfterHabitSave();
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      <View className="mx-auto w-full max-w-xl p-4 pb-12">
        <HabitForm
          mode="create"
          initialValue={initialValue}
          onSubmit={save}
          isPending={mutation.isPending}
        />
      </View>
    </ScrollView>
  );
}

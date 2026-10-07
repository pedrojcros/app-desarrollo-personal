import { jest, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { View } from 'react-native';
import { ThemeScope } from '@/theme/theme-scope';
import NewTaskScreen from '@/app/tareas/nueva';
import NewHabitScreen from '@/app/habitos/nuevo';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({
    name: 'Nombre escrito',
    dueDate: '2026-10-08',
    startDate: '2026-10-09',
  }),
  useRouter: () => ({}),
}));
jest.mock('@/data/tasks', () => ({
  useCreateTask: () => ({ isPending: false }),
}));
jest.mock('@/data/habits', () => ({
  useCreateHabit: () => ({ isPending: false }),
}));
jest.mock('@/data/use-today', () => ({ useToday: () => '2026-10-07' }));
jest.mock('@/components/task-form', () => {
  const { TextInput } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return {
    EMPTY_TASK_FORM_VALUES: { name: '' },
    TaskForm: ({ initialValues }: { initialValues: { name: string } }) => (
      <TextInput accessibilityLabel="Task name" value={initialValues.name} />
    ),
  };
});
jest.mock('@/components/habit-form', () => {
  const { TextInput } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return {
    HabitForm: ({ initialValue }: { initialValue: { name: string } }) => (
      <TextInput accessibilityLabel="Habit name" value={initialValue.name} />
    ),
  };
});
it('carries the quick draft name into both complete forms', () => {
  render(
    <ThemeScope themeName="white">
      <View>
        <NewTaskScreen />
        <NewHabitScreen />
      </View>
    </ThemeScope>,
  );
  expect(screen.getByLabelText('Task name')).toHaveDisplayValue(
    'Nombre escrito',
  );
  expect(screen.getByLabelText('Habit name')).toHaveDisplayValue(
    'Nombre escrito',
  );
});

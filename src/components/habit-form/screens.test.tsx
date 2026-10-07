import { beforeEach, expect, it, jest } from '@jest/globals';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { ThemeScope } from '@/theme/theme-scope';
import { useSession } from '@/data/auth';
import {
  useCreateHabit,
  useHabit,
  useUpdateHabit,
  useArchiveHabit,
} from '@/data/habits';
import { router, useLocalSearchParams } from 'expo-router';
import NewHabitScreen from '@/app/habitos/nuevo';
import EditHabitScreen from '@/app/habitos/[id]';
import HabitLayout from '@/app/habitos/_layout';

jest.mock('expo-router', () => {
  const { Text } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return {
    router: {
      back: jest.fn(),
      canGoBack: jest.fn(() => true),
      replace: jest.fn(),
    },
    useLocalSearchParams: jest.fn(),
    Stack: () => <Text>Habit stack</Text>,
    Redirect: ({ href }: { href: string }) => <Text>Redirect {href}</Text>,
  };
});
jest.mock('@/data/auth', () => ({ useSession: jest.fn() }));
jest.mock('@/data/habits', () => ({
  useCreateHabit: jest.fn(),
  useHabit: jest.fn(),
  useUpdateHabit: jest.fn(),
  useArchiveHabit: jest.fn(),
}));
jest.mock('@/data/use-today', () => ({ useToday: () => '2026-10-07' }));
jest.mock('@/components/habit-form', () => {
  const { Button, Text } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return {
    HabitForm: ({
      initialValue,
      onSubmit,
    }: {
      initialValue: object;
      onSubmit: (value: object) => Promise<void>;
    }) => (
      <>
        <Text testID="initial-value">{JSON.stringify(initialValue)}</Text>
        <Button title="Submit draft" onPress={() => onSubmit(initialValue)} />
      </>
    ),
  };
});
const mutate = jest.fn<() => Promise<null>>().mockResolvedValue(null);
const archive = jest.fn<() => Promise<null>>().mockResolvedValue(null);

beforeEach(() => {
  jest.clearAllMocks();
  jest
    .mocked(useCreateHabit)
    .mockReturnValue({ mutateAsync: mutate, isPending: false } as never);
  jest
    .mocked(useUpdateHabit)
    .mockReturnValue({ mutateAsync: mutate, isPending: false } as never);
  jest
    .mocked(useArchiveHabit)
    .mockReturnValue({ mutateAsync: archive, isPending: false } as never);
});

it('prefills valid route parameters and returns after creation', async () => {
  const categoryId = '11111111-1111-4111-8111-111111111111';
  jest
    .mocked(useLocalSearchParams)
    .mockReturnValue({ categoryId, startDate: '2026-11-01' });
  render(
    <ThemeScope themeName="white">
      <NewHabitScreen />
    </ThemeScope>,
  );
  expect(screen.getByTestId('initial-value')).toHaveTextContent(
    new RegExp(categoryId),
  );
  expect(screen.getByTestId('initial-value')).toHaveTextContent(/2026-11-01/);
  fireEvent.press(screen.getByText('Submit draft'));
  await waitFor(() => expect(router.back).toHaveBeenCalled());
});

it('edits through a single mutation and requires confirmation before archiving', async () => {
  jest
    .mocked(useLocalSearchParams)
    .mockReturnValue({ id: '11111111-1111-4111-8111-111111111111' });
  jest.mocked(useHabit).mockReturnValue({
    data: {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Leer',
      categoryId: null,
      sectionId: null,
      startDate: '2026-10-01',
      timeOfDay: null,
      timeSlot: null,
      archivedOn: null,
      ruleVersions: [
        {
          validFrom: '2026-10-01',
          frequency: 'daily',
          weekdays: [],
          intervalDays: null,
        },
      ],
    },
  } as never);
  render(
    <ThemeScope themeName="white">
      <EditHabitScreen />
    </ThemeScope>,
  );
  fireEvent.press(screen.getByText('Submit draft'));
  await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
  expect(mutate).toHaveBeenCalledWith(
    expect.objectContaining({
      schedule: expect.objectContaining({ today: '2026-10-07' }),
    }),
  );
  fireEvent.press(screen.getByRole('button', { name: 'Archivar hábito' }));
  expect(archive).not.toHaveBeenCalled();
  expect(
    screen.getByText('Dejará de aparecer, pero su historial se conserva'),
  ).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));
  expect(archive).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('button', { name: 'Archivar hábito' }));
  fireEvent.press(screen.getByRole('button', { name: 'Archivar' }));
  await waitFor(() => expect(archive).toHaveBeenCalledTimes(1));
});

it('waits for hydration then redirects unauthenticated users', () => {
  jest.mocked(useSession).mockReturnValue({ session: null, isLoading: true });
  const view = render(
    <ThemeScope themeName="white">
      <HabitLayout />
    </ThemeScope>,
  );
  expect(screen.queryByText('Redirect /login')).toBeNull();
  jest.mocked(useSession).mockReturnValue({ session: null, isLoading: false });
  view.rerender(
    <ThemeScope themeName="white">
      <HabitLayout />
    </ThemeScope>,
  );
  expect(screen.getByText('Redirect /login')).toBeTruthy();
});

it('returns to Hoy after a save opened through a direct URL with no navigation history', async () => {
  jest.mocked(router.canGoBack).mockReturnValueOnce(false);
  jest.mocked(useLocalSearchParams).mockReturnValue({});
  render(
    <ThemeScope themeName="white">
      <NewHabitScreen />
    </ThemeScope>,
  );
  fireEvent.press(screen.getByText('Submit draft'));
  await waitFor(() =>
    expect(router.replace).toHaveBeenCalledWith('/(tabs)/hoy'),
  );
});

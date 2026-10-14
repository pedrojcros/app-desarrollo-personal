import { beforeEach, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import UpcomingScreen from '@/app/(tabs)/proximo';
import { useUpcomingView } from '@/data/upcoming';
import type { ViewItem } from '@/domain/items';
import { groupUpcomingItems } from '@/domain/views/upcoming';
import { ThemeScope } from '@/theme/theme-scope';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/data/upcoming', () => ({ useUpcomingView: jest.fn() }));
jest.mock('@/data/categories', () => ({
  useCategories: () => ({
    data: [{ id: 'health', name: 'Salud', color: 'teal' }],
    isPending: false,
    isError: false,
    refetch: jest.fn(),
  }),
}));
jest.mock('@/data/use-today', () => ({ useToday: () => '2026-10-14' }));

const swim: ViewItem = {
  target: { kind: 'occurrence', habitId: 'swim', date: '2026-10-21' },
  name: 'Nadar',
  date: '2026-10-21',
  sortTime: '17:00',
  categoryId: 'health',
  sectionId: null,
  status: 'pending',
  markedAt: null,
};
const task: ViewItem = {
  ...swim,
  target: { kind: 'task', taskId: 'essay' },
  name: 'Entregar trabajo',
};
const retry = jest.fn();
function renderScreen() {
  return render(
    <ThemeScope themeName="white">
      <UpcomingScreen />
    </ThemeScope>,
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useUpcomingView).mockReturnValue({
    data: groupUpcomingItems([swim, task], '2026-10-14'),
    isPending: false,
    isError: false,
    refetch: retry,
  } as never);
});
it('shows week and day headings, metadata and free weeks without mark actions', () => {
  renderScreen();
  expect(screen.getByRole('header', { name: 'Miércoles 21' })).toBeTruthy();
  expect(
    screen.getByRole('header', { name: 'Semana del 19 al 25 de octubre' }),
  ).toBeTruthy();
  expect(screen.getAllByText('Semana libre').length).toBeGreaterThan(0);
  expect(screen.getByText('17:00 · Salud · Hábito')).toBeTruthy();
  expect(
    screen.queryAllByLabelText(/Marcar|Todavía no se puede marcar/),
  ).toHaveLength(0);
  expect(screen.getAllByRole('button')).toHaveLength(2);
});
it.each([
  { item: swim, path: '/habitos/swim' },
  { item: task, path: '/tareas/essay' },
])('opens the detail for $path', ({ item, path }) => {
  renderScreen();
  fireEvent.press(
    screen.getByRole('button', {
      name: `${item.name}, Miércoles 21, 17:00, Salud, abre la ficha`,
    }),
  );
  expect(router.push).toHaveBeenCalledWith(path);
});
it('shows loading', () => {
  jest
    .mocked(useUpcomingView)
    .mockReturnValue({ isPending: true, isError: false } as never);
  renderScreen();
  expect(screen.getByText('Cargando próximo…')).toBeTruthy();
});
it('offers retry after a read error', () => {
  jest.mocked(useUpcomingView).mockReturnValue({
    isPending: false,
    isError: true,
    refetch: retry,
  } as never);
  renderScreen();
  expect(screen.getByRole('alert')).toHaveTextContent(
    'No se pudo cargar lo próximo.',
  );
  fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
  expect(retry).toHaveBeenCalledTimes(1);
});
it('keeps all free weeks in an empty range', () => {
  jest.mocked(useUpcomingView).mockReturnValue({
    data: groupUpcomingItems([], '2026-10-14'),
    isPending: false,
    isError: false,
  } as never);
  renderScreen();
  expect(screen.getAllByText('Semana libre')).toHaveLength(5);
});

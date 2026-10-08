import { beforeEach, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import HistoryScreen from '@/app/(tabs)/historial';
import { useHistory } from '@/data/history';
import { ThemeScope } from '@/theme/theme-scope';
import type { ViewItem } from '@/domain/items';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

jest.mock('@/data/history', () => ({ useHistory: jest.fn() }));
const mockMarkItem = jest.fn();
jest.mock('@/data/marks', () => ({
  useMarkItem: () => ({ markItem: mockMarkItem, isMarking: false }),
}));
jest.mock('@/data/categories', () => ({
  useCategories: jest.fn(() => ({ data: [], error: null, refetch: jest.fn() })),
}));
jest.mock('@/data/use-today', () => ({ useToday: () => '2026-10-07' }));
jest.mock('@/data/time-zone', () => ({
  getDeviceTimeZone: () => 'Europe/Madrid',
}));
jest.mock('@react-native-community/datetimepicker', () => ({
  DateTimePickerAndroid: { open: jest.fn() },
}));
const refetch = jest.fn();
const item: ViewItem = {
  target: { kind: 'task', taskId: 'milk' },
  name: 'Leche',
  status: 'done',
  date: null,
  sortTime: null,
  categoryId: null,
  sectionId: null,
  markedAt: '2026-10-05T22:00:00Z',
};
const notDoneItem: ViewItem = {
  target: { kind: 'task', taskId: 'water' },
  name: 'Agua',
  status: 'not_done',
  date: null,
  sortTime: null,
  categoryId: null,
  sectionId: null,
  markedAt: '2026-10-05T22:00:00Z',
};
function setQuery(
  data: { items: ViewItem[] } | undefined,
  error: Error | null = null,
) {
  jest
    .mocked(useHistory)
    .mockReturnValue({ data, error, refetch } as unknown as ReturnType<
      typeof useHistory
    >);
}
function showScreen() {
  return render(
    <ThemeScope themeName="white" className="flex-1">
      <HistoryScreen />
    </ThemeScope>,
  );
}
beforeEach(() => {
  jest.clearAllMocks();
});
it('shows the default seven days and a mark on the Madrid day', () => {
  setQuery({ items: [item] });
  showScreen();
  expect(useHistory).toHaveBeenCalledWith('2026-10-01', '2026-10-07');
  expect(
    screen.getByRole('button', { name: 'Leche, martes 6 de octubre: hecha' }),
  ).toBeTruthy();
  expect(
    screen.getByLabelText('martes 6 de octubre: 100% hechas'),
  ).toBeTruthy();
});
it('keeps the applied range when the final date precedes the start', () => {
  setQuery({ items: [item] });
  showScreen();
  fireEvent.press(screen.getByRole('button', { name: 'Fecha final' }));
  const options = jest.mocked(DateTimePickerAndroid.open).mock.calls[0][0];
  const selected = new Date(2026, 8, 30, 12);
  act(() => {
    options.onChange?.(
      {
        type: 'set',
        nativeEvent: { timestamp: selected.getTime(), utcOffset: 120 },
      },
      selected,
    );
  });
  expect(
    screen.getByText('La fecha final no puede ser anterior a la inicial'),
  ).toBeTruthy();
  expect(useHistory).toHaveBeenLastCalledWith('2026-10-01', '2026-10-07');
});
it('shows a designed empty state only after a completed read', () => {
  setQuery({ items: [] });
  showScreen();
  expect(screen.getByText('No hay nada en estas fechas')).toBeTruthy();
});
it('shows loading separately from empty', () => {
  setQuery(undefined);
  showScreen();
  expect(screen.getByText('Cargando historial…')).toBeTruthy();
  expect(screen.queryByText('No hay nada en estas fechas')).toBeNull();
});
it('shows a friendly failure and retries without exposing the technical error', () => {
  setQuery(undefined, new Error('Internal server failure'));
  showScreen();
  expect(screen.queryByText('Internal server failure')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
  expect(refetch).toHaveBeenCalledTimes(1);
});

it('applies a valid custom range and clears the previous range error', () => {
  setQuery({ items: [item] });
  showScreen();
  fireEvent.press(screen.getByRole('button', { name: 'Fecha final' }));
  const options = jest.mocked(DateTimePickerAndroid.open).mock.calls[0][0];
  const invalidDate = new Date(2026, 8, 30, 12);
  const validDate = new Date(2026, 9, 6, 12);
  act(() =>
    options.onChange?.(
      {
        type: 'set',
        nativeEvent: { timestamp: invalidDate.getTime(), utcOffset: 120 },
      },
      invalidDate,
    ),
  );
  act(() =>
    options.onChange?.(
      {
        type: 'set',
        nativeEvent: { timestamp: validDate.getTime(), utcOffset: 120 },
      },
      validDate,
    ),
  );
  expect(useHistory).toHaveBeenLastCalledWith('2026-10-01', '2026-10-06');
  expect(
    screen.queryByText('La fecha final no puede ser anterior a la inicial'),
  ).toBeNull();
});
it.each([
  [
    'Fecha final',
    new Date(2026, 9, 8, 12),
    'La fecha final no puede ser posterior a hoy',
  ],
  ['Fecha inicial', new Date(2025, 9, 6, 12), 'Elige como mucho un año'],
])(
  'keeps the old range when %s violates the limits',
  (label, selectedDate, message) => {
    setQuery({ items: [] });
    showScreen();
    fireEvent.press(screen.getByRole('button', { name: label }));
    const options = jest.mocked(DateTimePickerAndroid.open).mock.calls[0][0];
    act(() =>
      options.onChange?.(
        {
          type: 'set',
          nativeEvent: { timestamp: selectedDate.getTime(), utcOffset: 120 },
        },
        selectedDate,
      ),
    );
    expect(screen.getByText(message)).toBeTruthy();
    expect(useHistory).toHaveBeenLastCalledWith('2026-10-01', '2026-10-07');
  },
);
it('keeps complete cached history visible alongside a refresh failure', () => {
  setQuery({ items: [item] }, new Error('Refresh failure'));
  showScreen();
  expect(
    screen.getByRole('button', { name: 'Leche, martes 6 de octubre: hecha' }),
  ).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy();
});

it('opens the status menu for a past cell and saves the selected correction', () => {
  setQuery({ items: [item] });
  showScreen();

  fireEvent.press(
    screen.getByRole('button', {
      name: 'Leche, martes 6 de octubre: hecha',
    }),
  );
  const doneOption = screen.getByRole('radio', { name: 'Hecha' });
  expect(doneOption.props.accessibilityState.checked).toBe(true);

  fireEvent.press(screen.getByRole('radio', { name: 'No hecha' }));

  expect(mockMarkItem).toHaveBeenCalledWith(item, 'not_done');
  expect(screen.queryByText('Cambiar estado')).toBeNull();
});

it('does not make a cell clickable when the element did not occur that day', () => {
  setQuery({ items: [item] });
  showScreen();

  expect(
    screen.queryByRole('button', {
      name: 'Leche, miércoles 7 de octubre: no tocaba',
    }),
  ).toBeNull();
});

it('filters the history to not-done items and recalculates the visible percentage', () => {
  setQuery({ items: [item, notDoneItem] });
  showScreen();

  fireEvent.press(screen.getByRole('radio', { name: 'No hechas' }));

  expect(
    screen.getByRole('button', {
      name: 'Agua, martes 6 de octubre: no hecha',
    }),
  ).toBeTruthy();
  expect(
    screen.queryByRole('button', { name: 'Leche, martes 6 de octubre: hecha' }),
  ).toBeNull();
  expect(screen.getByLabelText('martes 6 de octubre: 0% hechas')).toBeTruthy();
});

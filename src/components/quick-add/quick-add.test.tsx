import { jest, beforeEach, expect, it } from '@jest/globals';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { formatFullDate } from '@/components/date-field/format';
import { ThemeContext } from '@/theme/theme-context';
import { themeColors, themeFonts, themeShapes } from '@/theme/tokens';
import { QuickAddButton, QuickAddProvider } from './index';

const mockCreateTask = jest.fn<(input: unknown) => Promise<{ id: string }>>();
const mockCreateHabit = jest.fn<(input: unknown) => Promise<{ id: string }>>();
const mockPush = jest.fn();
jest.mock('@/data/tasks', () => ({
  useCreateTask: () => ({ mutateAsync: mockCreateTask, isPending: false }),
}));
jest.mock('@/data/habits', () => ({
  useCreateHabit: () => ({ mutateAsync: mockCreateHabit, isPending: false }),
}));
jest.mock('@/data/categories', () => ({
  useCategories: () => ({ data: [], isError: false }),
}));
jest.mock('@/data/use-today', () => ({ useToday: () => '2026-10-07' }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

function openBar() {
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 360, height: 640 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ThemeContext.Provider
        value={{
          themeName: 'white',
          preference: 'white',
          setPreference: () => {},
          colors: themeColors.white,
          fonts: themeFonts.white,
          shape: themeShapes.white,
        }}
      >
        <QuickAddProvider>
          <QuickAddButton
            defaults={{
              dueDate: '2026-10-07',
              categoryId: null,
              sectionId: null,
            }}
          />
        </QuickAddProvider>
      </ThemeContext.Provider>
    </SafeAreaProvider>,
  );
  fireEvent.press(screen.getByLabelText('Añadir tarea o hábito'));
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCreateTask.mockResolvedValue({ id: 'task' });
  mockCreateHabit.mockResolvedValue({ id: 'habit' });
});

it('submits on Enter and keeps an empty bar with the same date', async () => {
  openBar();
  fireEvent.changeText(screen.getByLabelText('Nombre'), 'Comprar pilas');
  fireEvent(screen.getByLabelText('Nombre'), 'submitEditing');
  await waitFor(() =>
    expect(screen.getByLabelText('Nombre')).toHaveDisplayValue(''),
  );
  expect(mockCreateTask).toHaveBeenCalledWith({
    name: 'Comprar pilas',
    notes: null,
    dueTime: null,
    dueDate: '2026-10-07',
    categoryId: null,
    sectionId: null,
  });
  fireEvent.changeText(screen.getByLabelText('Nombre'), 'Otra tarea');
  fireEvent.press(screen.getByLabelText('Enviar'));
  await waitFor(() => expect(mockCreateTask).toHaveBeenCalledTimes(2));
});

it('keeps the draft after a save failure and allows retrying', async () => {
  mockCreateTask.mockRejectedValueOnce({ code: 'network_error' });
  openBar();
  fireEvent.changeText(screen.getByLabelText('Nombre'), 'Comprar pilas');
  fireEvent.press(screen.getByLabelText('Enviar'));
  await screen.findByText('No hay conexión. Inténtalo de nuevo.');
  expect(screen.getByLabelText('Nombre')).toHaveDisplayValue('Comprar pilas');
  fireEvent.press(screen.getByLabelText('Enviar'));
  await waitFor(() =>
    expect(screen.getByLabelText('Nombre')).toHaveDisplayValue(''),
  );
});

it('preserves the name when switching kind and passes it to More', () => {
  openBar();
  fireEvent.changeText(screen.getByLabelText('Nombre'), 'Nadar');
  fireEvent.press(screen.getByText('Hábito'));
  expect(screen.getByLabelText('Nombre')).toHaveDisplayValue('Nadar');
  fireEvent.press(screen.getByText('Más'));
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/habitos/nuevo',
    params: { name: 'Nadar', startDate: '2026-10-07' },
  });
  expect(screen.queryByLabelText('Nombre')).toBeNull();
});

it('validates a weekly habit before saving and sends the selected day', async () => {
  openBar();
  fireEvent.changeText(screen.getByLabelText('Nombre'), 'Nadar');
  fireEvent.press(screen.getByText('Hábito'));
  fireEvent.press(screen.getByLabelText('Frecuencia'));
  fireEvent.press(screen.getByText('Días de la semana'));
  fireEvent.press(screen.getByLabelText('Enviar'));
  expect(screen.getByText('Elige al menos un día.')).toBeVisible();
  expect(mockCreateHabit).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText('Martes'));
  fireEvent.press(screen.getByLabelText('Enviar'));
  await waitFor(() =>
    expect(screen.getByLabelText('Nombre')).toHaveDisplayValue(''),
  );
  expect(mockCreateHabit).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'Nadar',
      frequency: 'weekdays',
      weekdays: [2],
      startDate: '2026-10-07',
    }),
  );
});

it('closes when touching outside', () => {
  openBar();
  fireEvent.press(screen.getByLabelText('Cerrar añadir rápido'));
  expect(screen.queryByLabelText('Nombre')).toBeNull();
});

it('passes task date and name to More', () => {
  openBar();
  fireEvent.changeText(screen.getByLabelText('Nombre'), 'Comprar pilas');
  fireEvent.press(screen.getByText('Más'));
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/tareas/nueva',
    params: { name: 'Comprar pilas', dueDate: '2026-10-07' },
  });
});

it('keeps the task date when switching kinds and selects tomorrow', async () => {
  openBar();
  fireEvent.changeText(screen.getByLabelText('Nombre'), 'Comprar pilas');
  fireEvent.press(screen.getByLabelText('Fecha: Mañana'));
  fireEvent.press(screen.getByText('Hábito'));
  fireEvent.press(screen.getByText('Tarea'));
  fireEvent.press(screen.getByLabelText('Enviar'));
  await waitFor(() =>
    expect(mockCreateTask).toHaveBeenCalledWith(
      expect.objectContaining({ dueDate: '2026-10-08' }),
    ),
  );
});

it.each([
  ['', 'El nombre es obligatorio.'],
  ['x'.repeat(121), 'El nombre puede tener hasta 120 caracteres.'],
])('rejects an invalid task name before saving', (name, message) => {
  openBar();
  fireEvent.changeText(screen.getByLabelText('Nombre'), name);
  fireEvent.press(screen.getByLabelText('Enviar'));
  expect(screen.getByText(message)).toBeVisible();
  expect(screen.getByLabelText('Nombre')).toHaveDisplayValue(name);
  expect(mockCreateTask).not.toHaveBeenCalled();
});
it.each(['0', '366', '1.5', ''])(
  'rejects an invalid habit interval %s',
  (interval) => {
    openBar();
    fireEvent.changeText(screen.getByLabelText('Nombre'), 'Leer');
    fireEvent.press(screen.getByText('Hábito'));
    fireEvent.press(screen.getByLabelText('Frecuencia'));
    fireEvent.press(screen.getByText('Cada N días'));
    fireEvent.changeText(screen.getByLabelText('Cada cuántos días'), interval);
    fireEvent.press(screen.getByLabelText('Enviar'));
    expect(
      screen.getByText('Escribe un número entero de 1 a 365.'),
    ).toBeVisible();
    expect(screen.getByLabelText('Nombre')).toHaveDisplayValue('Leer');
    expect(mockCreateHabit).not.toHaveBeenCalled();
  },
);
it('does not offer an undated habit and validates its name limit', () => {
  openBar();
  fireEvent.changeText(screen.getByLabelText('Nombre'), 'x'.repeat(81));
  fireEvent.press(screen.getByText('Hábito'));
  expect(screen.queryByLabelText('Fecha: Sin fecha')).toBeNull();
  fireEvent.press(screen.getByLabelText('Enviar'));
  expect(
    screen.getByText('Escribe un nombre de 1 a 80 caracteres.'),
  ).toBeVisible();
  expect(mockCreateHabit).not.toHaveBeenCalled();
});

it('names the quick-add dialog for assistive technology', () => {
  openBar();
  expect(screen.getByLabelText('Añadir rápido')).toBeTruthy();
});

it('names the frequency options as a radio group', () => {
  openBar();
  fireEvent.press(screen.getByRole('radio', { name: 'Hábito' }));
  fireEvent.press(screen.getByLabelText('Frecuencia'));
  const namedElements = screen.getAllByLabelText('Frecuencia');
  expect(namedElements.length).toBeGreaterThan(1);
});

it('paints the empty name field with the muted colour and the typed one with the foreground', () => {
  openBar();
  const nameField = screen.getByLabelText('Nombre');
  expect(nameField).toHaveStyle({
    color: themeColors.white['muted-foreground'],
  });
  fireEvent.changeText(nameField, 'Leer');
  expect(nameField).toHaveStyle({ color: themeColors.white.foreground });
});

it('shows the chosen date formatted instead of as YYYY-MM-DD', () => {
  openBar();
  fireEvent.press(screen.getByLabelText('Fecha: Mañana'));
  expect(screen.getByText(formatFullDate('2026-10-08'))).toBeVisible();
  expect(screen.queryByText('2026-10-08')).toBeNull();
});

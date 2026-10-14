import { jest, beforeEach, afterEach, expect, it } from '@jest/globals';
import {
  act,
  cleanupAsync,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import type { ReactNode } from 'react';
import {
  Keyboard,
  Platform,
  TextInput,
  type KeyboardEventListener,
} from 'react-native';
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

function renderWithProvider(children: ReactNode) {
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
        <QuickAddProvider>{children}</QuickAddProvider>
      </ThemeContext.Provider>
    </SafeAreaProvider>,
  );
}

function openBar() {
  renderWithProvider(
    <QuickAddButton
      defaults={{
        dueDate: '2026-10-07',
        categoryId: null,
        sectionId: null,
      }}
    />,
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

const subscribeKeyboard = Keyboard.addListener.bind(Keyboard);
let activeHideListeners: Set<KeyboardEventListener>;
beforeEach(() => {
  activeHideListeners = new Set();
  jest
    .spyOn(Keyboard, 'addListener')
    .mockImplementation((eventName, listener) => {
      const subscription = subscribeKeyboard(eventName, listener);
      if (eventName !== 'keyboardDidHide') {
        return subscription;
      }
      activeHideListeners.add(listener);
      // Solo cuentan los oyentes que siguen suscritos, como en el sistema.
      const removeSubscription = subscription.remove.bind(subscription);
      subscription.remove = () => {
        activeHideListeners.delete(listener);
        removeSubscription();
      };
      return subscription;
    });
});
afterEach(() => {
  jest.restoreAllMocks();
});
function dismissSystemKeyboard() {
  const event = {} as Parameters<KeyboardEventListener>[0];
  for (const listener of [...activeHideListeners]) {
    act(() => listener(event));
  }
}
it('uses body typography and disables name autofill', () => {
  openBar();
  const nameField = screen.getByLabelText('Nombre');
  expect(nameField.props.className).toContain('text-body');
  expect(nameField.props.autoComplete).toBe('off');
  expect(nameField.props.importantForAutofill).toBe('no');
});
it('disables interval autofill', () => {
  openBar();
  fireEvent.press(screen.getByText('Hábito'));
  fireEvent.press(screen.getByLabelText('Frecuencia'));
  fireEvent.press(screen.getByText('Cada N días'));
  const intervalField = screen.getByLabelText('Cada cuántos días');
  expect(intervalField.props.autoComplete).toBe('off');
  expect(intervalField.props.importantForAutofill).toBe('no');
});
it('closes on system keyboard hide and restores the typed name and kind when reopened', () => {
  openBar();
  fireEvent.changeText(screen.getByLabelText('Nombre'), 'Leer un capítulo');
  fireEvent.press(screen.getByText('Hábito'));
  dismissSystemKeyboard();
  expect(screen.queryByLabelText('Nombre')).toBeNull();
  fireEvent.press(screen.getByLabelText('Añadir tarea o hábito'));
  expect(screen.getByLabelText('Nombre')).toHaveDisplayValue(
    'Leer un capítulo',
  );
  expect(screen.getByRole('radio', { name: 'Hábito' })).toBeChecked();
});
it('restores the habit options of the draft when reopened', () => {
  openBar();
  fireEvent.changeText(screen.getByLabelText('Nombre'), 'Nadar');
  fireEvent.press(screen.getByText('Hábito'));
  fireEvent.press(screen.getByLabelText('Frecuencia'));
  fireEvent.press(screen.getByText('Cada mes'));
  dismissSystemKeyboard();
  fireEvent.press(screen.getByLabelText('Añadir tarea o hábito'));
  expect(screen.getByLabelText('Frecuencia')).toHaveTextContent('Cada mes');
});
it('takes the place and dates from the screen that reopens it, not from the draft', async () => {
  renderWithProvider(
    <>
      <QuickAddButton
        defaults={{ dueDate: '2026-10-07', categoryId: null, sectionId: null }}
      />
      <QuickAddButton
        defaults={{ dueDate: '2026-10-09', categoryId: null, sectionId: null }}
      />
    </>,
  );
  const [firstScreenButton, secondScreenButton] = screen.getAllByLabelText(
    'Añadir tarea o hábito',
  );
  fireEvent.press(firstScreenButton);
  fireEvent.changeText(screen.getByLabelText('Nombre'), 'Leer un capítulo');
  fireEvent.press(screen.getByLabelText('Fecha: Mañana'));
  dismissSystemKeyboard();
  fireEvent.press(secondScreenButton);
  expect(screen.getByLabelText('Nombre')).toHaveDisplayValue(
    'Leer un capítulo',
  );
  expect(screen.getByText(formatFullDate('2026-10-09'))).toBeVisible();
  fireEvent.press(screen.getByLabelText('Enviar'));
  await waitFor(() =>
    expect(mockCreateTask).toHaveBeenCalledWith(
      expect.objectContaining({ dueDate: '2026-10-09' }),
    ),
  );
});
it('reopens empty and as a task after a successful send', async () => {
  openBar();
  fireEvent.changeText(screen.getByLabelText('Nombre'), 'Nadar');
  fireEvent.press(screen.getByText('Hábito'));
  fireEvent.press(screen.getByLabelText('Enviar'));
  await waitFor(() =>
    expect(screen.getByLabelText('Nombre')).toHaveDisplayValue(''),
  );
  fireEvent.press(screen.getByLabelText('Cerrar añadir rápido'));
  fireEvent.press(screen.getByLabelText('Añadir tarea o hábito'));
  expect(screen.getByLabelText('Nombre')).toHaveDisplayValue('');
  expect(screen.getByRole('radio', { name: 'Tarea' })).toBeChecked();
});
it('reopens empty after going to More so the name is not duplicated', () => {
  openBar();
  fireEvent.changeText(screen.getByLabelText('Nombre'), 'Comprar pilas');
  fireEvent.press(screen.getByText('Más'));
  fireEvent.press(screen.getByLabelText('Añadir tarea o hábito'));
  expect(screen.getByLabelText('Nombre')).toHaveDisplayValue('');
});
it('reopens empty when the typed name was erased before closing', () => {
  openBar();
  fireEvent.changeText(screen.getByLabelText('Nombre'), 'Comprar pilas');
  fireEvent.changeText(screen.getByLabelText('Nombre'), '');
  dismissSystemKeyboard();
  fireEvent.press(screen.getByLabelText('Añadir tarea o hábito'));
  expect(screen.getByLabelText('Nombre')).toHaveDisplayValue('');
});
it('stays open when the keyboard hides while saving and keeps the bar for the next one', async () => {
  let finishSaving: () => void = () => {};
  mockCreateTask.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finishSaving = () => resolve({ id: 'task' });
      }),
  );
  openBar();
  fireEvent.changeText(screen.getByLabelText('Nombre'), 'Comprar pilas');
  fireEvent.press(screen.getByLabelText('Enviar'));
  dismissSystemKeyboard();
  expect(screen.getByLabelText('Nombre')).toBeVisible();
  const focus = jest.spyOn(TextInput.prototype, 'focus');
  await act(async () => finishSaving());
  await waitFor(() =>
    expect(screen.getByLabelText('Nombre')).toHaveDisplayValue(''),
  );
  expect(focus).toHaveBeenCalled();
  expect(screen.getByLabelText('Nombre')).toBeVisible();
});
it('closes on a keyboard hide once saving has finished and the field has its focus back', async () => {
  openBar();
  fireEvent.changeText(screen.getByLabelText('Nombre'), 'Comprar pilas');
  fireEvent.press(screen.getByLabelText('Enviar'));
  await waitFor(() =>
    expect(screen.getByLabelText('Nombre')).toHaveDisplayValue(''),
  );
  dismissSystemKeyboard();
  expect(screen.queryByLabelText('Nombre')).toBeNull();
});
it('does not listen to the keyboard while the bar is closed', () => {
  const dismiss = jest.spyOn(Keyboard, 'dismiss');
  openBar();
  fireEvent.press(screen.getByLabelText('Cerrar añadir rápido'));
  dismiss.mockClear();
  dismissSystemKeyboard();
  expect(dismiss).not.toHaveBeenCalled();
});
it.each([
  'Calendario',
  'Categoría: Bandeja de entrada',
  'Frecuencia',
  'Cuándo',
])('keeps the bar when %s hides the keyboard', (selectorLabel) => {
  openBar();
  if (selectorLabel === 'Frecuencia' || selectorLabel === 'Cuándo') {
    fireEvent.press(screen.getByText('Hábito'));
  }
  fireEvent.press(screen.getByLabelText(selectorLabel));
  dismissSystemKeyboard();
  expect(screen.getByLabelText('Nombre')).toBeVisible();
});
it('closes after the category selector has closed', () => {
  openBar();
  fireEvent.press(screen.getByLabelText('Categoría: Bandeja de entrada'));
  dismissSystemKeyboard();
  fireEvent.press(screen.getByRole('radio', { name: 'Bandeja de entrada' }));
  dismissSystemKeyboard();
  expect(screen.queryByLabelText('Nombre')).toBeNull();
});

it('closes after switching away from an open habit selector', () => {
  openBar();
  fireEvent.press(screen.getByText('Hábito'));
  fireEvent.press(screen.getByLabelText('Frecuencia'));
  fireEvent.press(screen.getByText('Tarea'));
  dismissSystemKeyboard();
  expect(screen.queryByLabelText('Nombre')).toBeNull();
});
it('keeps the draft while the native time picker hides the keyboard', () => {
  jest.spyOn(DateTimePickerAndroid, 'open').mockImplementation(() => {});
  openBar();
  fireEvent.press(screen.getByText('Hábito'));
  fireEvent.press(screen.getByLabelText('Cuándo'));
  fireEvent.press(screen.getByText('Hora exacta'));
  fireEvent.press(screen.getByLabelText('Hora exacta'));
  dismissSystemKeyboard();
  expect(screen.getByLabelText('Nombre')).toBeVisible();
});

it('closes on a restored web viewport and keeps the name after reopening', async () => {
  jest.replaceProperty(Platform, 'OS', 'web');
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const originalDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    'document',
  );
  const viewport = Object.assign(new EventTarget(), {
    height: 640,
    offsetTop: 0,
    scale: 1,
  });
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { visualViewport: viewport },
  });
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: Object.assign(new EventTarget(), {
      activeElement: { tagName: 'INPUT' },
    }),
  });
  function resizeViewport(height: number) {
    act(() => {
      viewport.height = height;
      viewport.dispatchEvent(new Event('resize'));
    });
  }
  try {
    openBar();
    fireEvent.changeText(screen.getByLabelText('Nombre'), 'Leer en la web');
    resizeViewport(320);
    fireEvent.press(screen.getByLabelText('Categoría: Bandeja de entrada'));
    resizeViewport(640);
    expect(screen.getByLabelText('Nombre')).toBeVisible();
    fireEvent.press(screen.getByRole('radio', { name: 'Bandeja de entrada' }));
    resizeViewport(320);
    resizeViewport(640);
    expect(screen.queryByLabelText('Nombre')).toBeNull();
    fireEvent.press(screen.getByLabelText('Añadir tarea o hábito'));
    expect(screen.getByLabelText('Nombre')).toHaveDisplayValue(
      'Leer en la web',
    );
  } finally {
    await cleanupAsync();
    if (originalWindow) {
      Object.defineProperty(globalThis, 'window', originalWindow);
    } else {
      Reflect.deleteProperty(globalThis, 'window');
    }
    if (originalDocument) {
      Object.defineProperty(globalThis, 'document', originalDocument);
    } else {
      Reflect.deleteProperty(globalThis, 'document');
    }
  }
});

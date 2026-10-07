import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  cleanup,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { UndoToastProvider } from '@/components/undo-toast';
import { ThemeContext } from '@/theme/theme-context';
import { themeColors, themeFonts, themeShapes } from '@/theme/tokens';

import TodayScreen from '@/app/(tabs)/hoy';
import type { ItemStatus, MarkTarget } from '@/domain/items';

type TableRows = Record<string, unknown[]>;

const mockRouterPush = jest.fn();
let mockTableRows: TableRows = {};
let mockFailReads = false;
let mockFailSave = false;
const queryClients: QueryClient[] = [];

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

jest.mock('@/data/use-today', () => ({ useToday: () => '2026-10-07' }));

jest.mock('@/data/categories', () => ({
  useCategories: () => ({
    data: [
      {
        id: 'personal',
        name: 'Personal',
        icon: 'home',
        color: 'teal',
        sections: [],
      },
    ],
  }),
}));

jest.mock('@/data/set-mark-status', () => ({
  isFutureOccurrence: () => false,
  restoreMarkStatus: async (target: MarkTarget, status: ItemStatus) =>
    mockSaveStatus(target, status, null),
  setMarkStatus: async (target: MarkTarget, status: ItemStatus) =>
    mockSaveStatus(target, status, '2026-10-07T10:00:00.000Z'),
}));

function mockSaveStatus(
  target: MarkTarget,
  status: ItemStatus,
  markedAt: string | null,
) {
  if (mockFailSave) {
    return {
      ok: false,
      error: { code: 'network_error', message: 'Save failed' },
    };
  }
  if (target.kind === 'task') {
    const rows = mockTableRows.tasks as Record<string, unknown>[];
    mockTableRows.tasks = rows.map((row) => {
      if (row.id !== target.taskId) {
        return row;
      }
      return { ...row, status, marked_at: markedAt };
    });
  } else {
    mockTableRows.habit_marks = [
      {
        habit_id: target.habitId,
        occurrence_date: target.date,
        status,
        marked_at: markedAt,
      },
    ];
  }
  return { ok: true, value: { markedAt } };
}

// Un constructor de consultas que acepta cualquier cadena de llamadas y responde con las filas de la tabla.
jest.mock('@/data/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      const builder: Record<string, unknown> = {};
      const chainMethods = [
        'select',
        'is',
        'eq',
        'gte',
        'lte',
        'order',
        'range',
      ];
      for (const method of chainMethods) {
        builder[method] = () => builder;
      }
      builder.then = (onFulfilled: never, onRejected: never) => {
        const response = mockFailReads
          ? { data: null, error: { message: 'boom' }, status: 500 }
          : { data: mockTableRows[table] ?? [], error: null, status: 200 };
        return Promise.resolve(response).then(onFulfilled, onRejected);
      };
      return builder;
    },
  },
}));

const themeValue = {
  themeName: 'white' as const,
  preference: 'white' as const,
  setPreference: () => {},
  colors: themeColors.white,
  fonts: themeFonts.white,
  shape: themeShapes.white,
};

const habitId = '11111111-1111-4111-8111-111111111111';
const milkId = '22222222-2222-4222-8222-222222222222';

const brushHabitRow = {
  id: habitId,
  name: 'Lavarme los dientes',
  category_id: 'personal',
  section_id: null,
  start_date: '2026-09-01',
  time_of_day: '21:00:00',
  time_slot: null,
  duration_minutes: null,
  archived_at: null,
  habit_rules: [
    {
      valid_from: '2026-09-01',
      frequency: 'daily',
      weekdays: null,
      interval_days: null,
    },
  ],
};

function makeTaskRow(overrides: Record<string, unknown>) {
  return {
    id: milkId,
    name: 'Leche',
    notes: null,
    category_id: null,
    section_id: null,
    due_date: '2026-10-07',
    due_time: null,
    status: 'pending',
    marked_at: null,
    archived_at: null,
    ...overrides,
  };
}

function renderScreen() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { gcTime: Infinity },
    },
  });
  queryClients.push(queryClient);
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 360, height: 640 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ThemeContext.Provider value={themeValue}>
        <QueryClientProvider client={queryClient}>
          <UndoToastProvider>
            <TodayScreen />
          </UndoToastProvider>
        </QueryClientProvider>
      </ThemeContext.Provider>
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  mockRouterPush.mockClear();
  mockFailReads = false;
  mockFailSave = false;
  mockTableRows = {};
});

afterEach(() => {
  cleanup();
  for (const queryClient of queryClients) {
    queryClient.clear();
  }
  queryClients.length = 0;
});

describe('Today screen', () => {
  it('shows the date, the heading and pending items with their meta', async () => {
    mockTableRows = { habits: [brushHabitRow], tasks: [makeTaskRow({})] };

    renderScreen();

    expect(await screen.findByText('Lavarme los dientes')).toBeTruthy();
    expect(screen.getByText('Miércoles, 7 de octubre de 2026')).toBeTruthy();
    expect(screen.getByText('Hoy')).toBeTruthy();
    expect(screen.getByText('21:00 · Personal · Hábito')).toBeTruthy();
    expect(screen.getByText('Tarea')).toBeTruthy();
    expect(screen.getByLabelText('0 de 2 marcadas')).toBeTruthy();
  });

  it('says it is a free day when nothing is due', async () => {
    renderScreen();

    expect(
      await screen.findByText('Hoy no tienes nada. Día libre.'),
    ).toBeTruthy();
  });

  it('says everything is done when all items are marked', async () => {
    const doneTask = makeTaskRow({
      status: 'done',
      marked_at: '2026-10-07T08:00:00.000Z',
    });
    mockTableRows = { tasks: [doneTask] };

    renderScreen();

    expect(await screen.findByText('Todo hecho por hoy.')).toBeTruthy();
    expect(screen.getByLabelText('1 de 1 marcadas')).toBeTruthy();
  });

  it('removes a marked item from the list and raises the counter', async () => {
    mockTableRows = { tasks: [makeTaskRow({})] };
    renderScreen();
    await screen.findByText('Leche');

    fireEvent.press(screen.getByLabelText('Marcar Leche como hecho'));

    await waitFor(() => {
      expect(screen.queryByLabelText('Marcar Leche como hecho')).toBeNull();
    });
    expect(screen.getByLabelText('1 de 1 marcadas')).toBeTruthy();
    expect(screen.getByText('Marcada como hecha')).toBeTruthy();
    expect(screen.getByText('Deshacer')).toBeTruthy();
    expect(screen.queryByText('Marcadas hoy')).toBeNull();
  });

  it('marks a habit as not done with one press', async () => {
    mockTableRows = { habits: [brushHabitRow] };
    renderScreen();
    await screen.findByText('Lavarme los dientes');

    fireEvent.press(
      screen.getByLabelText('Marcar Lavarme los dientes como no hecho'),
    );

    await waitFor(() => {
      expect(
        screen.queryByLabelText('Marcar Lavarme los dientes como no hecho'),
      ).toBeNull();
    });
    expect(screen.getByLabelText('1 de 1 marcadas')).toBeTruthy();
    expect(screen.getByText('Marcada como no hecha')).toBeTruthy();
  });

  it('restores the row and the counter when undo is pressed', async () => {
    mockTableRows = { tasks: [makeTaskRow({})] };
    renderScreen();
    await screen.findByText('Leche');
    fireEvent.press(screen.getByLabelText('Marcar Leche como hecho'));
    await screen.findByText('Todo hecho por hoy.');

    fireEvent.press(screen.getByText('Deshacer'));

    expect(
      await screen.findByLabelText('Marcar Leche como hecho'),
    ).toBeTruthy();
    expect(screen.getByLabelText('0 de 1 marcadas')).toBeTruthy();
  });

  it('keeps a failed mark pending and shows a friendly error', async () => {
    mockTableRows = { tasks: [makeTaskRow({})] };
    mockFailSave = true;
    renderScreen();
    await screen.findByText('Leche');

    fireEvent.press(screen.getByLabelText('Marcar Leche como hecho'));

    expect(
      await screen.findByText('No se ha podido guardar. Inténtalo de nuevo.'),
    ).toBeTruthy();
    expect(screen.getByLabelText('Marcar Leche como hecho')).toBeTruthy();
    expect(screen.getByLabelText('0 de 1 marcadas')).toBeTruthy();
  });

  it('opens the detail page when the title is pressed', async () => {
    mockTableRows = { habits: [brushHabitRow], tasks: [makeTaskRow({})] };
    renderScreen();
    await screen.findByText('Leche');

    fireEvent.press(screen.getByText('Leche'));
    fireEvent.press(screen.getByText('Lavarme los dientes'));

    expect(mockRouterPush).toHaveBeenCalledWith(`/tareas/${milkId}`);
    expect(mockRouterPush).toHaveBeenCalledWith(`/habitos/${habitId}`);
  });

  it('shows an error with a retry button that loads again', async () => {
    mockFailReads = true;
    renderScreen();
    expect(await screen.findByText('No se pudo cargar Hoy.')).toBeTruthy();

    mockFailReads = false;
    mockTableRows = { tasks: [makeTaskRow({})] };
    fireEvent.press(screen.getByText('Reintentar'));

    expect(await screen.findByText('Leche')).toBeTruthy();
  });
});

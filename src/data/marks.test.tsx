import {
  beforeAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  cleanup,
} from '@testing-library/react-native';
import { Button, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { UndoNotice } from '@/components/ui/undo-notice';
import { UndoToastProvider } from '@/components/undo-toast';
import { ThemeContext } from '@/theme/theme-context';
import { themeColors, themeFonts, themeShapes } from '@/theme/tokens';

import type { ItemStatus, ViewData, ViewItem } from '../domain/items';
import { useMarkItem } from './marks';
import { queryKeys } from './query-keys';

type SaveResponse = {
  data: unknown;
  error: { code?: string; message: string } | null;
  status: number;
};
type PendingSave = {
  table: string;
  payload: unknown;
  resolve: (response: SaveResponse) => void;
};

// Cada guardado queda a la espera: el test decide cuándo y cómo responde Supabase.
const mockPendingSaves: PendingSave[] = [];

jest.mock('./supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'habits') {
        const builder = {
          select: () => builder,
          eq: () =>
            Promise.resolve({
              data: [{ id: 'habit' }],
              error: null,
              status: 200,
            }),
        };
        return builder;
      }
      const save = { table, payload: undefined as unknown } as PendingSave;
      const builder = {
        update: (payload: unknown) => {
          save.payload = payload;
          return builder;
        },
        upsert: (payload: unknown) => {
          save.payload = payload;
          return builder;
        },
        delete: () => builder,
        eq: () => builder,
        select: () => builder,
        then: (onFulfilled: never, onRejected: never) => {
          const response = new Promise<SaveResponse>((resolve) => {
            save.resolve = resolve;
          });
          mockPendingSaves.push(save);
          return response.then(onFulfilled, onRejected);
        },
      };
      return builder;
    },
  },
}));

jest.mock('./use-today', () => ({
  useToday: () => '2026-10-07',
}));

const habitId = '11111111-1111-4111-8111-111111111111';
const milkId = '22222222-2222-4222-8222-222222222222';
const breadId = '33333333-3333-4333-8333-333333333333';
const successResponse: SaveResponse = {
  data: [{ id: milkId }],
  error: null,
  status: 200,
};
const failureResponse: SaveResponse = {
  data: null,
  error: { message: 'boom' },
  status: 500,
};

function createItem(overrides: Partial<ViewItem>): ViewItem {
  return {
    target: { kind: 'task', taskId: milkId },
    name: 'Leche',
    status: 'pending',
    date: null,
    sortTime: null,
    categoryId: null,
    sectionId: null,
    markedAt: null,
    ...overrides,
  };
}

const milk = createItem({});
const bread = createItem({
  target: { kind: 'task', taskId: breadId },
  name: 'Pan',
});
const toothbrushToday = createItem({
  target: { kind: 'occurrence', habitId, date: '2026-10-07' },
  name: 'Dientes hoy',
  date: '2026-10-07',
});
const toothbrushYesterday = createItem({
  target: { kind: 'occurrence', habitId, date: '2026-10-06' },
  name: 'Dientes ayer',
  date: '2026-10-06',
});
const toothbrushTomorrow = createItem({
  target: { kind: 'occurrence', habitId, date: '2026-10-08' },
  name: 'Dientes mañana',
  date: '2026-10-08',
});

const todayKey = queryKeys.today('2026-10-07');
const categoryKey = queryKeys.categoryView(null);

// Lee de la caché sin pedir nada a nadie (enabled: false), como lo haría una vista.
function ItemList({ queryKey }: { queryKey: readonly string[] }) {
  const { markItem } = useMarkItem();
  const query = useQuery<ViewData>({
    queryKey,
    queryFn: () => Promise.reject(new Error('Not used in this test')),
    enabled: false,
  });
  const items = query.data?.items ?? [];
  return (
    <>
      {items.map((item) => (
        <ItemRow key={item.name} item={item} markItem={markItem} />
      ))}
    </>
  );
}

function ItemRow({
  item,
  markItem,
}: {
  item: ViewItem;
  markItem: (item: ViewItem, status: ItemStatus) => void;
}) {
  return (
    <>
      <Text>{`${item.name}:${item.status}:${item.markedAt ?? 'none'}`}</Text>
      <Button
        title={`done ${item.name}`}
        onPress={() => markItem(item, 'done')}
      />
      <Button
        title={`pending ${item.name}`}
        onPress={() => markItem(item, 'pending')}
      />
      <Button
        title={`not done ${item.name}`}
        onPress={() => markItem(item, 'not_done')}
      />
    </>
  );
}

const themeValue = {
  themeName: 'white' as const,
  preference: 'white' as const,
  setPreference: () => {},
  colors: themeColors.white,
  fonts: themeFonts.white,
  shape: themeShapes.white,
};

function renderWithCaches(cachedLists: Record<string, ViewItem[]>) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { gcTime: Infinity },
      mutations: { gcTime: Infinity },
    },
  });
  queryClient.setQueryData<ViewData>(todayKey, { items: cachedLists.today });
  queryClient.setQueryData<ViewData>(categoryKey, {
    items: cachedLists.category ?? [],
  });
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
            <ItemList queryKey={todayKey} />
          </UndoToastProvider>
        </QueryClientProvider>
      </ThemeContext.Provider>
    </SafeAreaProvider>,
  );
  return queryClient;
}

// Deja que React Query aplique el parche, pero sin responder al guardado.
async function pressButton(label: string) {
  await act(async () => {
    fireEvent.press(screen.getByText(label));
    await jest.advanceTimersByTimeAsync(0);
  });
}

async function respondToSave(index: number, response: SaveResponse) {
  await act(async () => {
    mockPendingSaves[index].resolve(response);
    await jest.advanceTimersByTimeAsync(0);
  });
}

function readCachedItem(
  queryClient: QueryClient,
  key: readonly string[],
  name: string,
) {
  const viewData = queryClient.getQueryData<ViewData>(key);
  return viewData?.items.find((item) => item.name === name);
}

// NativeWind y React Native cargan módulos al primer render: se preparan fuera del caso medido.
beforeAll(() => {
  render(
    <ThemeContext.Provider value={themeValue}>
      <Button title="Preparación" onPress={() => {}} />
      <UndoNotice message="Preparación" />
    </ThemeContext.Provider>,
  );
  cleanup();
}, 20000);

beforeEach(() => {
  jest.useFakeTimers();
  mockPendingSaves.length = 0;
});

afterEach(() => {
  cleanup();
  jest.useRealTimers();
});

describe('useMarkItem', () => {
  it('marks as done before Supabase answers and shows the notice (CU-03, escenario 1)', async () => {
    renderWithCaches({ today: [milk] });

    await pressButton('done Leche');

    expect(screen.getByText(/^Leche:done:20/)).toBeTruthy();
    expect(screen.getByText('Marcada como hecha')).toBeTruthy();
    expect(screen.getByText('Deshacer')).toBeTruthy();
    expect(mockPendingSaves).toHaveLength(1);
    expect(mockPendingSaves[0].table).toBe('tasks');
    expect(mockPendingSaves[0].payload).toMatchObject({ status: 'done' });

    await respondToSave(0, successResponse);
    expect(screen.getByText(/^Leche:done:20/)).toBeTruthy();
  });

  it('marks as not done (CU-03, escenario 2)', async () => {
    renderWithCaches({ today: [milk] });

    await pressButton('not done Leche');

    expect(screen.getByText(/^Leche:not_done:20/)).toBeTruthy();
    expect(screen.getByText('Marcada como no hecha')).toBeTruthy();
    await respondToSave(0, successResponse);
  });

  it('undoes the mark without showing another undo notice (CU-03, escenario 9)', async () => {
    renderWithCaches({ today: [milk] });
    await pressButton('done Leche');
    await respondToSave(0, successResponse);

    await pressButton('Deshacer');

    expect(screen.getByText('Leche:pending:none')).toBeTruthy();
    expect(screen.queryByText('Deshacer')).toBeNull();
    expect(mockPendingSaves[1].payload).toMatchObject({
      status: 'pending',
      marked_at: null,
    });
    await respondToSave(1, successResponse);
    expect(screen.getByText('Leche:pending:none')).toBeTruthy();
  });

  it('keeps each occurrence independent (CU-03, escenario 10)', async () => {
    renderWithCaches({ today: [toothbrushYesterday, toothbrushToday] });

    await pressButton('done Dientes hoy');

    expect(screen.getByText(/^Dientes hoy:done:20/)).toBeTruthy();
    expect(screen.getByText('Dientes ayer:pending:none')).toBeTruthy();
    expect(mockPendingSaves[0].table).toBe('habit_marks');
    await respondToSave(0, successResponse);
  });

  it('refuses to mark a future occurrence (CU-03, escenario 8)', async () => {
    renderWithCaches({ today: [toothbrushTomorrow] });

    await pressButton('done Dientes mañana');

    expect(screen.getByText('Dientes mañana:pending:none')).toBeTruthy();
    expect(
      screen.getByText('Todavía no se puede marcar: ese día no ha llegado.'),
    ).toBeTruthy();
    expect(screen.queryByText('Deshacer')).toBeNull();
    expect(mockPendingSaves).toHaveLength(0);
  });

  it('rolls back and shows an error when saving fails (CU-03, E1)', async () => {
    renderWithCaches({ today: [milk] });
    await pressButton('done Leche');
    expect(screen.getByText(/^Leche:done:20/)).toBeTruthy();

    await respondToSave(0, failureResponse);

    expect(screen.getByText('Leche:pending:none')).toBeTruthy();
    expect(
      screen.getByText('No se ha podido guardar. Inténtalo de nuevo.'),
    ).toBeTruthy();
    expect(screen.queryByText('Deshacer')).toBeNull();
  });

  it('keeps the second mark when only the first one fails', async () => {
    renderWithCaches({ today: [milk, bread] });
    await pressButton('done Leche');
    await pressButton('done Pan');

    await respondToSave(1, successResponse);
    await respondToSave(0, failureResponse);

    expect(screen.getByText('Leche:pending:none')).toBeTruthy();
    expect(screen.getByText(/^Pan:done:20/)).toBeTruthy();
  });

  it('patches every cached view at once', async () => {
    const queryClient = renderWithCaches({
      today: [milk],
      category: [milk, bread],
    });

    await pressButton('done Leche');

    expect(readCachedItem(queryClient, todayKey, 'Leche')?.status).toBe('done');
    expect(readCachedItem(queryClient, categoryKey, 'Leche')?.status).toBe(
      'done',
    );
    expect(readCachedItem(queryClient, categoryKey, 'Pan')?.status).toBe(
      'pending',
    );
    await respondToSave(0, successResponse);
  });
});

it('restores the previous instant when undoing a marked item', async () => {
  const previousMarkedAt = '2026-10-06T09:00:00.000Z';
  const markedMilk = createItem({
    status: 'not_done',
    markedAt: previousMarkedAt,
  });
  renderWithCaches({ today: [markedMilk] });
  await pressButton('done Leche');
  await respondToSave(0, successResponse);

  await pressButton('Deshacer');

  expect(
    screen.getByText('Leche:not_done:2026-10-06T09:00:00.000Z'),
  ).toBeTruthy();
  expect(mockPendingSaves[1].payload).toMatchObject({
    status: 'not_done',
    marked_at: previousMarkedAt,
  });
  await respondToSave(1, successResponse);
});

it('returns a marked item to pending optimistically', async () => {
  renderWithCaches({
    today: [
      createItem({ status: 'done', markedAt: '2026-10-06T09:00:00.000Z' }),
    ],
  });
  await pressButton('pending Leche');
  expect(screen.getByText('Leche:pending:none')).toBeTruthy();
  expect(screen.getByText('Devuelta a pendiente')).toBeTruthy();
  await respondToSave(0, successResponse);
});

it('serializes undo after an unfinished save while showing the restored state immediately', async () => {
  renderWithCaches({ today: [milk] });
  await pressButton('done Leche');
  await pressButton('Deshacer');
  expect(screen.getByText('Leche:pending:none')).toBeTruthy();
  expect(mockPendingSaves).toHaveLength(1);
  await respondToSave(0, successResponse);
  expect(mockPendingSaves).toHaveLength(2);
  await respondToSave(1, successResponse);
  expect(screen.getByText('Leche:pending:none')).toBeTruthy();
});

it('keeps a newer state of the same item when an older save fails', async () => {
  renderWithCaches({ today: [milk] });
  await pressButton('done Leche');
  await pressButton('not done Leche');
  await respondToSave(0, failureResponse);
  expect(screen.getByText(/^Leche:not_done:20/)).toBeTruthy();
  await respondToSave(1, successResponse);
  expect(screen.getByText(/^Leche:not_done:20/)).toBeTruthy();
});

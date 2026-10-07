import {
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
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { router } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { UndoToastProvider } from '@/components/undo-toast';
import { usePastPending, usePastPendingCount } from '@/data/past-pending';
import { queryKeys } from '@/data/query-keys';
import { succeed } from '@/data/result';
import { restoreMarkStatus, setMarkStatus } from '@/data/set-mark-status';
import type { ViewData, ViewItem } from '@/domain/items';
import { ThemeScope } from '@/theme/theme-scope';

import { PastPendingScreen } from './past-pending-screen';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/data/past-pending', () => ({
  ...jest.requireActual<typeof import('@/data/past-pending')>(
    '@/data/past-pending',
  ),
  usePastPending: jest.fn(),
}));
jest.mock('@/data/use-today', () => ({ useToday: () => '2026-10-07' }));
jest.mock('@/data/set-mark-status', () => ({
  ...jest.requireActual<typeof import('@/data/set-mark-status')>(
    '@/data/set-mark-status',
  ),
  setMarkStatus: jest.fn(),
  restoreMarkStatus: jest.fn(),
}));
jest.mock('@/data/supabase/client', () => ({ supabase: {} }));

const today = '2026-10-07';
const flossThreeDaysAgo: ViewItem = {
  target: { kind: 'occurrence', habitId: 'floss', date: '2026-10-04' },
  name: 'Hilo dental',
  status: 'pending',
  date: '2026-10-04',
  sortTime: '21:00',
  categoryId: null,
  sectionId: null,
  markedAt: null,
};
const invoiceYesterday: ViewItem = {
  target: { kind: 'task', taskId: 'invoice' },
  name: 'Factura',
  status: 'pending',
  date: '2026-10-06',
  sortTime: null,
  categoryId: null,
  sectionId: null,
  markedAt: null,
};
const usePastPendingMock = jest.mocked(usePastPending);
const retry = jest.fn();
let queryClient: QueryClient;

beforeEach(() => {
  jest.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { gcTime: Infinity },
    },
  });
  usePastPendingMock.mockImplementation(
    (date) =>
      useQuery<ViewData>({
        queryKey: queryKeys.pastPending(date),
        queryFn: async () => ({ items: [] }),
        enabled: false,
      }) as never,
  );
  jest
    .mocked(setMarkStatus)
    .mockResolvedValue(succeed({ markedAt: '2026-10-07T10:00:00Z' }));
  jest.mocked(restoreMarkStatus).mockResolvedValue(succeed({ markedAt: null }));
});
afterEach(() => queryClient.clear());

function renderScreen(items: ViewItem[]) {
  queryClient.setQueryData(queryKeys.pastPending(today), { items });
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 360, height: 640 },
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      }}
    >
      <ThemeScope themeName="white">
        <QueryClientProvider client={queryClient}>
          <UndoToastProvider>
            <PastPendingScreen />
          </UndoToastProvider>
        </QueryClientProvider>
      </ThemeScope>
    </SafeAreaProvider>,
  );
}

describe('Past pending screen', () => {
  it('groups items by day with the newest day first', () => {
    renderScreen([flossThreeDaysAgo, invoiceYesterday]);
    screen.getByText('Factura');
    const headings = screen.getAllByRole('header');
    expect(headings.map((heading) => heading.props.children)).toEqual([
      'Ayer',
      'Domingo, 4 de octubre',
    ]);
    expect(screen.getByText('21:00 · Hábito')).toBeTruthy();
    expect(screen.getByText('Tarea')).toBeTruthy();
  });

  it.each([
    { label: 'hecho', status: 'done' },
    { label: 'no hecho', status: 'not_done' },
  ] as const)(
    'marking $label keeps the original date and removes the item (CU-04, scenario 1)',
    async ({ label, status }) => {
      renderScreen([flossThreeDaysAgo]);
      screen.getByText('Hilo dental');
      fireEvent.press(
        screen.getByRole('button', {
          name: `Marcar Hilo dental como ${label}`,
        }),
      );
      await waitFor(() => expect(screen.queryByText('Hilo dental')).toBeNull());
      expect(setMarkStatus).toHaveBeenCalledWith(
        flossThreeDaysAgo.target,
        status,
        today,
      );
      expect(screen.getByText('Todo al día.')).toBeTruthy();
    },
  );

  it('brings the item back when Undo is pressed', async () => {
    renderScreen([flossThreeDaysAgo]);
    screen.getByText('Hilo dental');
    fireEvent.press(
      screen.getByRole('button', { name: 'Marcar Hilo dental como no hecho' }),
    );
    await waitFor(() => expect(screen.queryByText('Hilo dental')).toBeNull());
    fireEvent.press(screen.getByRole('button', { name: 'Deshacer' }));
    await waitFor(() => expect(screen.getByText('Hilo dental')).toBeTruthy());
  });

  it('says everything is up to date when nothing is pending', () => {
    renderScreen([]);
    expect(screen.getByText('Todo al día.')).toBeTruthy();
  });

  it('shows loading before the first read finishes', () => {
    usePastPendingMock.mockReturnValue({
      isPending: true,
      isError: false,
      data: undefined,
      refetch: retry,
    } as never);
    renderScreen([]);
    expect(screen.getByText('Cargando pendientes…')).toBeTruthy();
    expect(screen.queryByText('Todo al día.')).toBeNull();
  });

  it('offers retry after a read error without technical details', () => {
    usePastPendingMock.mockReturnValue({
      isPending: false,
      isError: true,
      data: undefined,
      error: new Error('database details'),
      refetch: retry,
    } as never);
    renderScreen([]);
    expect(screen.getByText('No se pudo cargar lo pendiente.')).toBeTruthy();
    expect(screen.queryByText('database details')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
    expect(retry).toHaveBeenCalled();
  });

  it.each([
    { item: invoiceYesterday, pathname: '/tareas/[id]', id: 'invoice' },
    { item: flossThreeDaysAgo, pathname: '/habitos/[id]', id: 'floss' },
  ])('opens the detail of $id when its title is pressed', (scenario) => {
    renderScreen([scenario.item]);
    const title = screen.getByRole('button', {
      name: `Abrir ${scenario.item.name}`,
    });
    fireEvent.press(title);
    expect(router.push).toHaveBeenCalledWith({
      pathname: scenario.pathname,
      params: { id: scenario.id },
    });
  });
});

describe('Pending tab counter', () => {
  it('counts the list items and drops marked ones', async () => {
    function Wrapper({ children }: PropsWithChildren) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }
    queryClient.setQueryData(queryKeys.pastPending(today), {
      items: [
        flossThreeDaysAgo,
        invoiceYesterday,
        { ...invoiceYesterday, status: 'done' },
      ],
    });
    const { result } = renderHook(() => usePastPendingCount(today), {
      wrapper: Wrapper,
    });
    expect(result.current).toBe(2);
  });
});

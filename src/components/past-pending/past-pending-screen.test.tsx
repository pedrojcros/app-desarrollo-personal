import {
  afterEach,
  beforeAll,
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
  cleanup,
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
import { NOTICE_DURATION_MILLISECONDS } from '@/components/undo-toast/undo-toast-provider';
import { useRescheduleTask } from '@/data/tasks';
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
jest.mock('@/data/tasks', () => ({ useRescheduleTask: jest.fn() }));
jest.mock('@react-native-community/datetimepicker', () => ({
  DateTimePickerAndroid: { open: jest.fn() },
}));

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
const mealPrepYesterday: ViewItem = {
  ...invoiceYesterday,
  target: { kind: 'task', taskId: 'meal-prep' },
  name: 'Preparar comida',
};
const usePastPendingMock = jest.mocked(usePastPending);
const retry = jest.fn();
const rescheduleMutate = jest.fn();
let queryClient: QueryClient;

function prepareMocks() {
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
  jest.mocked(useRescheduleTask).mockReturnValue({
    mutate: rescheduleMutate,
    isPending: false,
  } as never);
}

// Los módulos de la pantalla, del diálogo y del aviso cargan al primer uso y,
// con la CI cargada, ese arranque en frío tardaba más que el propio test.
// Se hace una vez, fuera de los casos medidos.
beforeAll(async () => {
  prepareMocks();
  renderScreen([invoiceYesterday, flossThreeDaysAgo]);
  fireEvent.press(screen.getByRole('button', { name: 'Todo no hecho: Ayer' }));
  fireEvent.press(screen.getByRole('button', { name: 'Marcar como no hecho' }));
  await waitFor(() => expect(screen.queryByText('Factura')).toBeNull(), {
    timeout: 30000,
  });
  cleanup();
  queryClient.clear();
}, 60000);

beforeEach(() => {
  prepareMocks();
  keepNoticeVisible();
});
afterEach(() => {
  queryClient.clear();
  jest.restoreAllMocks();
});

// El aviso con «Deshacer» se oculta solo a los 4 s (eso ya lo prueba el test del
// aviso). Con el reloj real, una máquina lenta lo veía desaparecer antes de que
// estos tests lo buscaran, así que aquí se anula solo ese temporizador.
function keepNoticeVisible() {
  const realSetTimeout = global.setTimeout;
  jest.spyOn(global, 'setTimeout').mockImplementation(((
    callback: () => void,
    delay?: number,
  ) => {
    if (delay === NOTICE_DURATION_MILLISECONDS) {
      return 0;
    }
    return realSetTimeout(callback, delay);
  }) as never);
}

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

describe('Reschedule an overdue task (RF-13)', () => {
  it('offers Reschedule on tasks only', () => {
    renderScreen([invoiceYesterday, flossThreeDaysAgo]);
    expect(
      screen.getByRole('button', { name: 'Reprogramar Factura' }),
    ).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: 'Reprogramar Hilo dental' }),
    ).toBeNull();
  });

  it('asks the new date and saves it for that task', () => {
    renderScreen([invoiceYesterday]);
    fireEvent.press(
      screen.getByRole('button', { name: 'Reprogramar Factura' }),
    );
    fireEvent.press(screen.getByRole('button', { name: 'Mañana' }));
    fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(rescheduleMutate).toHaveBeenCalledWith(
      { taskId: 'invoice', newDueDate: expect.any(String) },
      expect.anything(),
    );
  });

  it('closes the dialog when the task is saved', () => {
    rescheduleMutate.mockImplementation(((
      _variables: unknown,
      options: { onSuccess: () => void },
    ) => options.onSuccess()) as never);
    renderScreen([invoiceYesterday]);
    fireEvent.press(
      screen.getByRole('button', { name: 'Reprogramar Factura' }),
    );
    fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(screen.queryByRole('button', { name: 'Guardar' })).toBeNull();
  });

  it('keeps the dialog open with a message when saving fails', () => {
    rescheduleMutate.mockImplementation(((
      _variables: unknown,
      options: { onError: () => void },
    ) => options.onError()) as never);
    renderScreen([invoiceYesterday]);
    fireEvent.press(
      screen.getByRole('button', { name: 'Reprogramar Factura' }),
    );
    fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(
      screen.getByText('No se ha podido reprogramar. Inténtalo de nuevo.'),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeTruthy();
  });

  it('leaves the task untouched when the dialog is cancelled', () => {
    renderScreen([invoiceYesterday]);
    fireEvent.press(
      screen.getByRole('button', { name: 'Reprogramar Factura' }),
    );
    fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));
    expect(rescheduleMutate).not.toHaveBeenCalled();
    expect(screen.getByText('Factura')).toBeTruthy();
  });
});

describe('Mark a whole day as not done (RF-14)', () => {
  // Dos guardados y un diálogo por medio: en la CI, más de 1 s (el valor por defecto).
  const SLOW_RENDER_TIMEOUT = 5000;
  // Tope del test entero (no una espera): ha de ser mayor que la espera de arriba.
  const SLOW_TEST_TIMEOUT = 15000;
  const markDayButton = 'Todo no hecho: Ayer';

  it('has one action per day header', () => {
    renderScreen([flossThreeDaysAgo, invoiceYesterday]);
    expect(
      screen.getByRole('button', { name: 'Todo no hecho: Ayer' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', {
        name: 'Todo no hecho: Domingo, 4 de octubre',
      }),
    ).toBeTruthy();
  });

  it('asks for confirmation and saves nothing when cancelled', () => {
    renderScreen([invoiceYesterday, mealPrepYesterday]);
    fireEvent.press(screen.getByRole('button', { name: markDayButton }));
    expect(
      screen.getByText(
        'Se marcarán como no hechas las 2 cosas pendientes de ese día.',
      ),
    ).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));
    expect(setMarkStatus).not.toHaveBeenCalled();
    expect(screen.getByText('Factura')).toBeTruthy();
  });

  it(
    'marks everything pending that day with a single notice',
    async () => {
      renderScreen([invoiceYesterday, mealPrepYesterday, flossThreeDaysAgo]);
      fireEvent.press(screen.getByRole('button', { name: markDayButton }));
      fireEvent.press(
        screen.getByRole('button', { name: 'Marcar como no hecho' }),
      );
      await waitFor(() => expect(screen.queryByText('Factura')).toBeNull(), {
        timeout: SLOW_RENDER_TIMEOUT,
      });
      expect(screen.queryByText('Preparar comida')).toBeNull();
      expect(screen.getByText('Hilo dental')).toBeTruthy();
      expect(setMarkStatus).toHaveBeenCalledTimes(2);
      expect(screen.getAllByText('2 marcadas como no hechas')).toHaveLength(1);
    },
    SLOW_TEST_TIMEOUT,
  );

  it(
    'brings the whole day back with Undo',
    async () => {
      renderScreen([invoiceYesterday, mealPrepYesterday]);
      fireEvent.press(screen.getByRole('button', { name: markDayButton }));
      fireEvent.press(
        screen.getByRole('button', { name: 'Marcar como no hecho' }),
      );
      await waitFor(() => expect(screen.queryByText('Factura')).toBeNull(), {
        timeout: SLOW_RENDER_TIMEOUT,
      });
      fireEvent.press(screen.getByRole('button', { name: 'Deshacer' }));
      await waitFor(() => expect(screen.getByText('Factura')).toBeTruthy(), {
        timeout: SLOW_RENDER_TIMEOUT,
      });
      expect(screen.getByText('Preparar comida')).toBeTruthy();
    },
    SLOW_TEST_TIMEOUT,
  );
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

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
  screen,
  waitFor,
} from '@testing-library/react-native';
import { router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { UndoToastProvider } from '@/components/undo-toast';
import { useCategories, type Category } from '@/data/categories';
import { useCategoryView } from '@/data/category-view';
import { queryKeys } from '@/data/query-keys';
import { succeed } from '@/data/result';
import { restoreMarkStatus, setMarkStatus } from '@/data/set-mark-status';
import type { ViewData, ViewItem } from '@/domain/items';
import { ThemeScope } from '@/theme/theme-scope';

import { CategoryViewScreen } from './category-view-screen';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/data/categories', () => ({ useCategories: jest.fn() }));
jest.mock('@/data/category-view', () => ({ useCategoryView: jest.fn() }));
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
const category: Category = {
  id: 'shopping',
  name: 'Lista de la compra',
  icon: 'shopping-cart',
  color: 'teal',
  sections: [
    { id: 'mercadona', categoryId: 'shopping', name: 'Mercadona' },
    { id: 'lidl', categoryId: 'shopping', name: 'Lidl' },
  ],
};
const milk: ViewItem = {
  target: { kind: 'task', taskId: 'milk' },
  name: 'Leche',
  status: 'pending',
  date: null,
  sortTime: null,
  categoryId: 'shopping',
  sectionId: 'mercadona',
  markedAt: null,
};
const useCategoriesMock = jest.mocked(useCategories);
const useCategoryViewMock = jest.mocked(useCategoryView);
let queryClient: QueryClient;
const retry = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { gcTime: Infinity },
    },
  });
  useCategoriesMock.mockReturnValue({
    data: [category],
    isPending: false,
    isError: false,
    refetch: retry,
  } as never);
  useCategoryViewMock.mockImplementation(
    (categoryId, date) =>
      useQuery<ViewData>({
        queryKey: [...queryKeys.categoryView(categoryId), date],
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

function renderView(
  items: ViewItem[] = [],
  categoryId: string | null = 'shopping',
) {
  queryClient.setQueryData([...queryKeys.categoryView(categoryId), today], {
    items,
  });
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
            <CategoryViewScreen categoryId={categoryId} />
          </UndoToastProvider>
        </QueryClientProvider>
      </ThemeScope>
    </SafeAreaProvider>,
  );
}

describe('Category and Inbox screens', () => {
  it('shows sections in name order with unsectioned content last (CU-07.6)', () => {
    renderView([
      milk,
      {
        ...milk,
        target: { kind: 'task', taskId: 'bread' },
        name: 'Pan',
        sectionId: 'lidl',
      },
      {
        ...milk,
        target: { kind: 'task', taskId: 'eggs' },
        name: 'Huevos',
        sectionId: null,
      },
    ]);
    const headings = screen.getAllByRole('header');
    expect(headings.map((heading) => heading.props.children)).toEqual([
      'Lista de la compra',
      'Lidl',
      'Mercadona',
      'Sin sección',
    ]);
    expect(screen.getByText('Leche')).toBeTruthy();
    expect(screen.getByText('Huevos')).toBeTruthy();
  });
  it.each([
    { label: 'hecho', status: 'done', notice: 'Marcada como hecha' },
    { label: 'no hecho', status: 'not_done', notice: 'Marcada como no hecha' },
  ] as const)(
    'marking $label removes the item and Undo restores it (CU-03.6)',
    async ({ label, status, notice }) => {
      renderView([milk]);
      fireEvent.press(
        screen.getByRole('button', { name: `Marcar Leche como ${label}` }),
      );
      await waitFor(() => expect(screen.queryByText('Leche')).toBeNull());
      expect(screen.getByText(notice)).toBeTruthy();
      expect(setMarkStatus).toHaveBeenCalledWith(milk.target, status, today);
      fireEvent.press(screen.getByRole('button', { name: 'Deshacer' }));
      await waitFor(() => expect(screen.getByText('Leche')).toBeTruthy());
      expect(restoreMarkStatus).toHaveBeenCalledWith(
        milk.target,
        'pending',
        today,
        null,
      );
    },
  );
  it('shows Inbox dated and undated tasks without sections', () => {
    renderView(
      [
        { ...milk, categoryId: null, sectionId: null },
        {
          ...milk,
          target: { kind: 'task', taskId: 'bank' },
          name: 'Llamar al banco',
          categoryId: null,
          sectionId: null,
          date: today,
        },
      ],
      null,
    );
    expect(screen.getByText('Bandeja de entrada')).toBeTruthy();
    expect(screen.getByText('Leche')).toBeTruthy();
    expect(screen.getByText('Llamar al banco')).toBeTruthy();
    expect(screen.queryByText('Sin sección')).toBeNull();
  });
  it('shows a helpful empty state', () => {
    renderView();
    expect(screen.getByText('No hay nada pendiente aquí.')).toBeTruthy();
  });
  it('keeps loading distinct from empty', () => {
    useCategoryViewMock.mockReturnValue({
      isPending: true,
      isError: false,
      data: undefined,
      refetch: retry,
    } as never);
    renderView();
    expect(screen.getByText('Cargando pendientes…')).toBeTruthy();
    expect(screen.queryByText('No hay nada pendiente aquí.')).toBeNull();
  });
  it('offers retry after a view read error without exposing technical details', () => {
    useCategoryViewMock.mockReturnValue({
      isPending: false,
      isError: true,
      data: undefined,
      error: new Error('database details'),
      refetch: retry,
    } as never);
    renderView();
    expect(screen.getByText('No se pudo cargar lo pendiente.')).toBeTruthy();
    expect(screen.queryByText('database details')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
    expect(retry).toHaveBeenCalled();
  });
  it('retries failed category metadata instead of showing ungrouped contents', () => {
    useCategoriesMock.mockReturnValue({
      isPending: false,
      isError: true,
      data: undefined,
      refetch: retry,
    } as never);
    renderView([milk]);
    expect(screen.getByText('No se pudo cargar la categoría.')).toBeTruthy();
    expect(screen.queryByText('Leche')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
    expect(retry).toHaveBeenCalled();
  });
  it('shows a missing category instead of masquerading as the Inbox', () => {
    useCategoriesMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: [],
      refetch: retry,
    } as never);
    renderView();
    expect(screen.getByText('Esta categoría ya no existe.')).toBeTruthy();
    expect(screen.queryByText('Bandeja de entrada')).toBeNull();
  });
  it.each(['task', 'occurrence'] as const)(
    'opens the %s detail when its title is pressed',
    (kind) => {
      const target =
        kind === 'task'
          ? milk.target
          : { kind: 'occurrence' as const, habitId: 'read', date: today };
      renderView([{ ...milk, target }]);
      fireEvent.press(screen.getByRole('button', { name: 'Abrir Leche' }));
      const pathname = kind === 'task' ? '/tareas/[id]' : '/habitos/[id]';
      const id = kind === 'task' ? 'milk' : 'read';
      expect(router.push).toHaveBeenCalledWith({ pathname, params: { id } });
    },
  );
});

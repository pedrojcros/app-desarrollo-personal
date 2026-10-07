import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import {
  countCategoryContents,
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  type Category,
} from '@/data/categories';
import { useCreateSection, useDeleteSection } from '@/data/sections';
import { ThemeScope } from '@/theme/theme-scope';

import CategoriesScreen from '../app/(tabs)/categorias';

jest.mock('@/data/categories', () => ({
  countCategoryContents: jest.fn(),
  useCategories: jest.fn(),
  useCreateCategory: jest.fn(),
  useDeleteCategory: jest.fn(),
}));
jest.mock('@/data/sections', () => ({
  useCreateSection: jest.fn(),
  useDeleteSection: jest.fn(),
}));

const shoppingList: Category = {
  id: 'shopping-id',
  name: 'Lista de la compra',
  icon: 'shopping-cart',
  color: 'amber',
  sections: [
    { id: 'lidl-id', categoryId: 'shopping-id', name: 'Lidl' },
    { id: 'mercadona-id', categoryId: 'shopping-id', name: 'Mercadona' },
  ],
};

const createCategoryMutate = jest.fn();
const deleteCategoryMutate = jest.fn();
const createSectionMutate = jest.fn();
const deleteSectionMutate = jest.fn();

function mockCategoriesQuery(query: Record<string, unknown>) {
  jest.mocked(useCategories).mockReturnValue(query as never);
}

function mockMutation(
  hook: unknown,
  mutate: jest.Mock,
  overrides: Record<string, unknown> = {},
) {
  jest
    .mocked(hook as () => unknown)
    .mockReturnValue({ mutate, isPending: false, ...overrides });
}

function renderScreen() {
  render(
    <ThemeScope themeName="white" preference="white">
      <CategoriesScreen />
    </ThemeScope>,
  );
}

function mockLoaded(categories: Category[]) {
  mockCategoriesQuery({
    data: categories,
    isPending: false,
    isError: false,
    refetch: jest.fn(),
  });
}

describe('Categories screen', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockMutation(useCreateCategory, createCategoryMutate);
    mockMutation(useDeleteCategory, deleteCategoryMutate);
    mockMutation(useCreateSection, createSectionMutate);
    mockMutation(useDeleteSection, deleteSectionMutate);
  });

  it('says there are no categories yet', () => {
    mockLoaded([]);
    renderScreen();

    expect(screen.getByText('Aún no tienes categorías')).toBeTruthy();
  });

  it('shows a loading state', () => {
    mockCategoriesQuery({ isPending: true, isError: false });
    renderScreen();

    expect(screen.getByText('Cargando categorías…')).toBeTruthy();
  });

  it('shows a friendly error with a retry, never the technical one', () => {
    const refetch = jest.fn();
    mockCategoriesQuery({
      isPending: false,
      isError: true,
      error: { code: 'unknown_error', message: 'PGRST301 boom' },
      refetch,
    });
    renderScreen();

    expect(
      screen.getByText('No se pudieron cargar las categorías.'),
    ).toBeTruthy();
    expect(screen.queryByText(/PGRST301/)).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
    expect(refetch).toHaveBeenCalled();
  });

  it('lists categories collapsed and unfolds their sections', () => {
    mockLoaded([shoppingList]);
    renderScreen();

    expect(screen.getByText('Lista de la compra')).toBeTruthy();
    expect(screen.getByText('2 secciones')).toBeTruthy();
    expect(screen.queryByText('Mercadona')).toBeNull();

    fireEvent.press(
      screen.getByRole('button', { name: 'Desplegar Lista de la compra' }),
    );
    expect(screen.getByText('Mercadona')).toBeTruthy();
    expect(screen.getByText('Lidl')).toBeTruthy();

    fireEvent.press(
      screen.getByRole('button', { name: 'Recoger Lista de la compra' }),
    );
    expect(screen.queryByText('Mercadona')).toBeNull();
  });

  // CU-07, escenario 5: la Bandeja no es una categoría y no tiene cómo eliminarse.
  it('does not offer the Inbox as a category to delete', () => {
    mockLoaded([shoppingList]);
    renderScreen();

    expect(screen.queryByText('Bandeja de entrada')).toBeNull();
    expect(screen.queryByText('Bandeja')).toBeNull();
    const deleteButtons = screen.getAllByLabelText(/^Eliminar la categoría /);
    expect(deleteButtons).toHaveLength(1);
  });

  it('creates a category with the chosen name, icon and color', () => {
    mockLoaded([]);
    renderScreen();

    fireEvent.press(screen.getByRole('button', { name: 'Nueva categoría' }));
    fireEvent.changeText(
      screen.getByLabelText('Nombre de la categoría'),
      'Compra',
    );
    fireEvent.press(screen.getByRole('radio', { name: 'Icono dumbbell' }));
    fireEvent.press(screen.getByRole('radio', { name: 'Color Granate' }));
    fireEvent.press(screen.getByRole('button', { name: 'Crear categoría' }));

    expect(createCategoryMutate).toHaveBeenCalledWith(
      { name: 'Compra', icon: 'dumbbell', color: 'garnet' },
      expect.any(Object),
    );
  });

  it('offers the five colors with their Spanish names and a grid of icons', () => {
    mockLoaded([]);
    renderScreen();

    fireEvent.press(screen.getByRole('button', { name: 'Nueva categoría' }));

    for (const label of [
      'Verde azulado',
      'Azul',
      'Verde',
      'Ámbar',
      'Granate',
    ]) {
      expect(
        screen.getByRole('radio', { name: `Color ${label}` }),
      ).toBeTruthy();
    }
    expect(screen.getAllByLabelText(/^Icono /)).toHaveLength(20);
  });

  it('explains a repeated name in Spanish', () => {
    mockLoaded([]);
    createCategoryMutate.mockImplementation((_input, options) => {
      (options as { onError: (error: unknown) => void }).onError({
        code: 'duplicate_name',
        message: 'That name is already in use',
      });
    });
    renderScreen();

    fireEvent.press(screen.getByRole('button', { name: 'Nueva categoría' }));
    fireEvent.changeText(
      screen.getByLabelText('Nombre de la categoría'),
      'compra',
    );
    fireEvent.press(screen.getByRole('button', { name: 'Crear categoría' }));

    expect(
      screen.getByText('Ya existe una categoría con ese nombre.'),
    ).toBeTruthy();
  });

  it('creates a section inside a category', () => {
    mockLoaded([shoppingList]);
    renderScreen();
    fireEvent.press(
      screen.getByRole('button', { name: 'Desplegar Lista de la compra' }),
    );

    fireEvent.press(screen.getByRole('button', { name: 'Nueva sección' }));
    fireEvent.changeText(screen.getByLabelText('Nombre de la sección'), 'Aldi');
    fireEvent.press(screen.getByRole('button', { name: 'Crear sección' }));

    expect(createSectionMutate).toHaveBeenCalledWith(
      { categoryId: 'shopping-id', name: 'Aldi' },
      expect.any(Object),
    );
  });

  it('asks for confirmation with the real counts before deleting a category', async () => {
    mockLoaded([shoppingList]);
    jest
      .mocked(countCategoryContents)
      .mockResolvedValue({ ok: true, value: { habits: 2, tasks: 3 } });
    renderScreen();

    fireEvent.press(
      screen.getByRole('button', {
        name: 'Eliminar la categoría Lista de la compra',
      }),
    );

    expect(
      await screen.findByText('Se moverán a la Bandeja 2 hábitos y 3 tareas.'),
    ).toBeTruthy();
    expect(deleteCategoryMutate).not.toHaveBeenCalled();
    fireEvent.press(screen.getByRole('button', { name: 'Eliminar' }));
    expect(deleteCategoryMutate).toHaveBeenCalledWith(
      'shopping-id',
      expect.any(Object),
    );
  });

  it('does not delete anything when the confirmation is cancelled', async () => {
    mockLoaded([shoppingList]);
    jest
      .mocked(countCategoryContents)
      .mockResolvedValue({ ok: true, value: { habits: 0, tasks: 1 } });
    renderScreen();
    fireEvent.press(
      screen.getByRole('button', {
        name: 'Eliminar la categoría Lista de la compra',
      }),
    );
    await screen.findByText('Se moverán a la Bandeja 0 hábitos y 1 tarea.');

    fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));

    expect(deleteCategoryMutate).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByText(/Se moverán a la Bandeja/)).toBeNull(),
    );
  });

  it('confirms before deleting a section and says where its content stays', () => {
    mockLoaded([shoppingList]);
    renderScreen();
    fireEvent.press(
      screen.getByRole('button', { name: 'Desplegar Lista de la compra' }),
    );

    fireEvent.press(
      screen.getByRole('button', { name: 'Eliminar la sección Mercadona' }),
    );

    expect(
      screen.getByText(
        'Lo que contiene seguirá en "Lista de la compra", sin sección.',
      ),
    ).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Eliminar' }));
    expect(deleteSectionMutate).toHaveBeenCalledWith(
      'mercadona-id',
      expect.any(Object),
    );
  });

  it('shows a friendly message when counting the content fails', async () => {
    mockLoaded([shoppingList]);
    jest.mocked(countCategoryContents).mockResolvedValue({
      ok: false,
      error: { code: 'network_error', message: 'Could not reach the server' },
    });
    renderScreen();

    fireEvent.press(
      screen.getByRole('button', {
        name: 'Eliminar la categoría Lista de la compra',
      }),
    );

    expect(
      await screen.findByText(
        'No se ha podido comprobar qué contiene. Inténtalo de nuevo.',
      ),
    ).toBeTruthy();
  });
});

import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import type { Category, RenameCategoryInput } from '@/data/categories';
import { DataResultError } from '@/data/result';
import { ThemeScope } from '@/theme/theme-scope';

import { CategoryRow } from './category-row';

type RenameMutationOptions = {
  onSuccess?: (category: null) => void;
  onError?: (error: DataResultError) => void;
};

const mockRenameCategory =
  jest.fn<
    (input: RenameCategoryInput, options?: RenameMutationOptions) => void
  >();

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/data/categories', () => ({
  useRenameCategory: () => ({
    isPending: false,
    mutate: mockRenameCategory,
  }),
}));
jest.mock('@/data/sections', () => ({
  useCreateSection: () => ({ isPending: false, mutate: jest.fn() }),
}));
const category: Category = {
  id: 'shopping',
  name: 'Compra',
  icon: 'shopping-cart',
  color: 'teal',
  sections: [{ id: 'store', categoryId: 'shopping', name: 'Mercadona' }],
};

it('opens the category by its name while the chevron still expands and collapses', () => {
  render(
    <ThemeScope themeName="white">
      <CategoryRow
        category={category}
        onDeleteCategory={jest.fn()}
        onDeleteSection={jest.fn()}
      />
    </ThemeScope>,
  );
  fireEvent.press(screen.getByRole('button', { name: 'Abrir Compra' }));
  expect(router.push).toHaveBeenCalledWith({
    pathname: '/categorias/[id]',
    params: { id: 'shopping' },
  });
  expect(screen.queryByText('Mercadona')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Desplegar Compra' }));
  expect(screen.getByText('Mercadona')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Recoger Compra' }));
  expect(screen.queryByText('Mercadona')).toBeNull();
});

it('cancels renaming without changing the category', () => {
  mockRenameCategory.mockClear();
  render(
    <ThemeScope themeName="white">
      <CategoryRow
        category={category}
        onDeleteCategory={jest.fn()}
        onDeleteSection={jest.fn()}
      />
    </ThemeScope>,
  );

  fireEvent.press(screen.getByRole('button', { name: 'Renombrar Compra' }));

  expect(screen.getByLabelText('Nombre de la categoría')).toHaveProp(
    'value',
    'Compra',
  );
  fireEvent.press(screen.getByText('Cancelar'));

  expect(screen.queryByLabelText('Nombre de la categoría')).toBeNull();
  expect(mockRenameCategory).not.toHaveBeenCalled();
});

it('shows a duplicate-name error beside the category name field', () => {
  mockRenameCategory.mockClear();
  mockRenameCategory.mockImplementationOnce((_input, options) => {
    const error = new DataResultError({
      code: 'duplicate_name',
      message: 'That name is already in use',
    });
    options?.onError?.(error);
  });
  render(
    <ThemeScope themeName="white">
      <CategoryRow
        category={category}
        onDeleteCategory={jest.fn()}
        onDeleteSection={jest.fn()}
      />
    </ThemeScope>,
  );

  fireEvent.press(screen.getByRole('button', { name: 'Renombrar Compra' }));
  fireEvent.changeText(screen.getByLabelText('Nombre de la categoría'), 'Otra');
  fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));

  expect(mockRenameCategory).toHaveBeenCalledWith(
    { categoryId: 'shopping', name: 'Otra' },
    expect.objectContaining({ onError: expect.any(Function) }),
  );
  expect(
    screen.getByText('Ya existe una categoría con ese nombre.'),
  ).toBeTruthy();
});

describe('Category deletion remains separate', () => {
  it('keeps deleting the chosen category without navigating', () => {
    jest.mocked(router.push).mockClear();
    const onDelete = jest.fn();
    render(
      <ThemeScope themeName="white">
        <CategoryRow
          category={category}
          onDeleteCategory={onDelete}
          onDeleteSection={jest.fn()}
        />
      </ThemeScope>,
    );
    fireEvent.press(
      screen.getByRole('button', { name: 'Eliminar la categoría Compra' }),
    );
    expect(onDelete).toHaveBeenCalledWith(category);
    expect(router.push).not.toHaveBeenCalled();
  });
});

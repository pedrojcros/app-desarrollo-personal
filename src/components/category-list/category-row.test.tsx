import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import type { Category } from '@/data/categories';
import { ThemeScope } from '@/theme/theme-scope';

import { CategoryRow } from './category-row';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
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

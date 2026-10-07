import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { useCategories, type Category } from '@/data/categories';
import { ThemeScope } from '@/theme/theme-scope';

import { CategorySelect, type CategorySelection } from './category-select';

jest.mock('@/data/categories', () => ({ useCategories: jest.fn() }));

const useCategoriesMock = jest.mocked(useCategories);

const shoppingList: Category = {
  id: 'shopping-id',
  name: 'Lista de la compra',
  icon: 'shopping-cart',
  color: 'amber',
  sections: [
    { id: 'mercadona-id', categoryId: 'shopping-id', name: 'Mercadona' },
    { id: 'lidl-id', categoryId: 'shopping-id', name: 'Lidl' },
  ],
};
const university: Category = {
  id: 'university-id',
  name: 'Universidad',
  icon: 'graduation-cap',
  color: 'blue',
  sections: [],
};

function mockCategories(data: Category[] | undefined, isError = false) {
  useCategoriesMock.mockReturnValue({ data, isError } as never);
}

function renderSelect(value: CategorySelection, openDirection?: 'up' | 'down') {
  const onChange = jest.fn();
  const element: ReactElement = (
    <ThemeScope themeName="white" preference="white">
      <CategorySelect
        value={value}
        onChange={onChange}
        openDirection={openDirection}
      />
    </ThemeScope>
  );
  render(element);
  return onChange;
}

const inbox = { categoryId: null, sectionId: null };

describe('CategorySelect', () => {
  beforeEach(() => {
    mockCategories([shoppingList, university]);
  });

  it('shows the Inbox when there is no category', () => {
    renderSelect(inbox);

    expect(
      screen.getByRole('button', { name: 'Categoría: Bandeja de entrada' }),
    ).toBeTruthy();
  });

  it('shows the category and the section of the current value', () => {
    renderSelect({ categoryId: 'shopping-id', sectionId: 'mercadona-id' });

    expect(
      screen.getByRole('button', {
        name: 'Categoría: Lista de la compra › Mercadona',
      }),
    ).toBeTruthy();
  });

  it('lists the Inbox first and then every category with its sections', () => {
    renderSelect(inbox);

    fireEvent.press(screen.getByRole('button', { name: /Categoría/ }));

    const options = screen.getAllByRole('radio');
    const labels = options.map((option) => option.props.accessibilityLabel);
    expect(labels).toEqual([
      'Bandeja de entrada',
      'Lista de la compra',
      'Lista de la compra › Mercadona',
      'Lista de la compra › Lidl',
      'Universidad',
    ]);
  });

  it('choosing a section also chooses its category and closes the list', () => {
    const onChange = renderSelect(inbox);
    fireEvent.press(screen.getByRole('button', { name: /Categoría/ }));

    fireEvent.press(
      screen.getByRole('radio', { name: 'Lista de la compra › Lidl' }),
    );

    expect(onChange).toHaveBeenCalledWith({
      categoryId: 'shopping-id',
      sectionId: 'lidl-id',
    });
    expect(screen.queryByLabelText('Elegir categoría y sección')).toBeNull();
  });

  it('choosing a category without section clears the section', () => {
    const onChange = renderSelect({
      categoryId: 'shopping-id',
      sectionId: 'lidl-id',
    });
    fireEvent.press(screen.getByRole('button', { name: /Categoría/ }));

    fireEvent.press(screen.getByRole('radio', { name: 'Universidad' }));

    expect(onChange).toHaveBeenCalledWith({
      categoryId: 'university-id',
      sectionId: null,
    });
  });

  it('choosing the Inbox clears category and section', () => {
    const onChange = renderSelect({
      categoryId: 'shopping-id',
      sectionId: 'lidl-id',
    });
    fireEvent.press(screen.getByRole('button', { name: /Categoría/ }));

    fireEvent.press(screen.getByRole('radio', { name: 'Bandeja de entrada' }));

    expect(onChange).toHaveBeenCalledWith(inbox);
  });

  it('marks the current choice as checked for screen readers', () => {
    renderSelect({ categoryId: 'university-id', sectionId: null });
    fireEvent.press(screen.getByRole('button', { name: /Categoría/ }));

    const checkedOptions = screen.getAllByRole('radio', { checked: true });

    expect(checkedOptions).toHaveLength(1);
    expect(checkedOptions[0].props.accessibilityLabel).toBe('Universidad');
  });

  it('opens upwards when asked to', () => {
    renderSelect(inbox, 'up');

    fireEvent.press(screen.getByRole('button', { name: /Categoría/ }));

    const group = screen.getByLabelText('Elegir categoría y sección');
    expect(group.props.className).toContain('bottom-full');
  });

  it('says so when the categories could not be loaded', () => {
    mockCategories(undefined, true);
    renderSelect(inbox);

    fireEvent.press(screen.getByRole('button', { name: /Categoría/ }));

    expect(
      screen.getByText('No se pudieron cargar las categorías.'),
    ).toBeTruthy();
  });
});

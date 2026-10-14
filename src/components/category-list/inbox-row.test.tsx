import { expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';

import { ThemeScope } from '@/theme/theme-scope';

import { InboxRow } from './inbox-row';

let mockPendingItems: unknown[] | undefined;

jest.mock('@/data/category-view', () => ({
  useCategoryView: () => {
    if (mockPendingItems === undefined) {
      return { data: undefined };
    }
    return { data: { items: mockPendingItems } };
  },
}));
jest.mock('@/data/use-today', () => ({ useToday: () => '2026-10-14' }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

it('includes the pending count in the accessible Inbox label', () => {
  mockPendingItems = [{}, {}, {}];

  render(
    <ThemeScope themeName="white">
      <InboxRow />
    </ThemeScope>,
  );

  expect(
    screen.getByRole('button', {
      name: 'Abrir Bandeja de entrada, 3 pendientes',
    }),
  ).toBeTruthy();
});

it('uses only the Inbox name when the count is zero', () => {
  mockPendingItems = [];

  render(
    <ThemeScope themeName="white">
      <InboxRow />
    </ThemeScope>,
  );

  expect(
    screen.getByRole('button', { name: 'Abrir Bandeja de entrada' }),
  ).toBeTruthy();
});

it('uses only the Inbox name while the count is unavailable', () => {
  mockPendingItems = undefined;

  render(
    <ThemeScope themeName="white">
      <InboxRow />
    </ThemeScope>,
  );

  expect(
    screen.getByRole('button', { name: 'Abrir Bandeja de entrada' }),
  ).toBeTruthy();
});

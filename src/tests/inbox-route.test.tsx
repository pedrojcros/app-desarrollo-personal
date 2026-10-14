import { beforeEach, expect, it, jest } from '@jest/globals';
import { render } from '@testing-library/react-native';
import type { Session } from '@supabase/supabase-js';
import { Redirect } from 'expo-router';

import { CategoryViewScreen } from '@/components/category-view/category-view-screen';
import { useSession } from '@/data/auth';
import { ThemeScope } from '@/theme/theme-scope';

import InboxScreen from '../app/bandeja';

jest.mock('@/data/auth', () => ({ useSession: jest.fn() }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('@/data/use-today', () => ({ useToday: () => '2026-10-09' }));
jest.mock('@/components/quick-add', () => ({ QuickAddButton: () => null }));
jest.mock('@/components/category-view/category-view-screen', () => ({
  CategoryViewScreen: jest.fn(() => null),
}));
jest.mock('expo-router', () => ({
  Redirect: jest.fn(() => null),
  Stack: { Screen: jest.fn(() => null) },
}));

function renderRoute() {
  render(
    <ThemeScope themeName="white">
      <InboxScreen />
    </ThemeScope>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

it('redirects anonymous Inbox visits to login', () => {
  jest.mocked(useSession).mockReturnValue({ session: null, isLoading: false });
  renderRoute();

  expect(jest.mocked(Redirect).mock.calls[0][0].href).toBe('/login');
  expect(CategoryViewScreen).not.toHaveBeenCalled();
});

it('waits for the persisted session before deciding navigation', () => {
  jest.mocked(useSession).mockReturnValue({ session: null, isLoading: true });
  renderRoute();

  expect(Redirect).not.toHaveBeenCalled();
  expect(CategoryViewScreen).not.toHaveBeenCalled();
});

it('shows the Inbox view, the one without a category, to a signed-in user', () => {
  jest
    .mocked(useSession)
    .mockReturnValue({ session: {} as Session, isLoading: false });
  renderRoute();

  expect(Redirect).not.toHaveBeenCalled();
  expect(jest.mocked(CategoryViewScreen).mock.calls[0][0]).toEqual({
    categoryId: null,
  });
});

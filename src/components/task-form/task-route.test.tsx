import { beforeEach, expect, it, jest } from '@jest/globals';
import { render } from '@testing-library/react-native';
import { Redirect } from 'expo-router';
import type { Session } from '@supabase/supabase-js';

import { useSession } from '@/data/auth';
import { ThemeScope } from '@/theme/theme-scope';
import TasksLayout from '@/app/tareas/_layout';

jest.mock('@/data/auth', () => ({ useSession: jest.fn() }));
jest.mock('expo-router', () => ({
  Redirect: jest.fn(() => null),
  Stack: Object.assign(
    jest.fn(() => null),
    { Screen: jest.fn(() => null) },
  ),
}));
function renderLayout() {
  render(
    <ThemeScope themeName="white">
      <TasksLayout />
    </ThemeScope>,
  );
}
beforeEach(() => {
  jest.clearAllMocks();
});
it('redirects anonymous task visits to login', () => {
  jest.mocked(useSession).mockReturnValue({ session: null, isLoading: false });
  renderLayout();
  expect(jest.mocked(Redirect).mock.calls[0][0].href).toBe('/login');
});
it('waits for persisted session before deciding navigation', () => {
  jest.mocked(useSession).mockReturnValue({ session: null, isLoading: true });
  renderLayout();
  expect(Redirect).not.toHaveBeenCalled();
});
it('allows authenticated task visits', () => {
  jest
    .mocked(useSession)
    .mockReturnValue({ session: {} as Session, isLoading: false });
  renderLayout();
  expect(Redirect).not.toHaveBeenCalled();
});

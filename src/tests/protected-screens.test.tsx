import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { Session } from '@supabase/supabase-js';
import { Redirect } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import { Text } from 'react-native';

import { useSession } from '@/data/auth';

import RootLayout from '../app/_layout';

jest.mock('@/theme/global.css', () => ({}));
jest.mock('@/data/auth', () => ({ useSession: jest.fn() }));

const useSessionMock = jest.mocked(useSession);

const routes = {
  _layout: RootLayout,
  index: () => <Redirect href="/hoy" />,
  login: () => <Text>Login screen</Text>,
  '(tabs)/_layout':
    jest.requireActual<typeof import('expo-router')>('expo-router').Slot,
  '(tabs)/hoy': () => <Text>Today screen</Text>,
};

function mockSession(session: Session | null, isLoading = false) {
  useSessionMock.mockReturnValue({ session, isLoading });
}

describe('Screen protection', () => {
  afterEach(() => {
    useSessionMock.mockReset();
  });

  it('shows only the login when there is no session', () => {
    mockSession(null);

    renderRouter(routes, { initialUrl: '/hoy' });

    expect(screen.getByText('Login screen')).toBeTruthy();
    expect(screen.queryByText('Today screen')).toBeNull();
  });

  it('sends the user to Today when there is a session', () => {
    mockSession({ access_token: 'token' } as Session);

    renderRouter(routes, { initialUrl: '/login' });

    expect(screen.getByText('Today screen')).toBeTruthy();
    expect(screen.queryByText('Login screen')).toBeNull();
  });

  it('shows nothing while the stored session is being checked', () => {
    mockSession(null, true);

    renderRouter(routes, { initialUrl: '/hoy' });

    expect(screen.queryByText('Login screen')).toBeNull();
    expect(screen.queryByText('Today screen')).toBeNull();
  });
});

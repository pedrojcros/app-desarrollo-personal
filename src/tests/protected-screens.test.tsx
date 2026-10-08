import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { Session } from '@supabase/supabase-js';
import { Redirect } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import { Text } from 'react-native';

import { useSession } from '@/data/auth';

import RootLayout from '../app/_layout';

jest.mock('@/components/quick-add', () => ({
  QuickAddProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@/theme/global.css', () => ({}));
jest.mock('@/data/auth', () => ({ useSession: jest.fn() }));
jest.mock('@/data/reminders', () => ({ useReminderSync: jest.fn() }));
jest.mock('@/data/reminders-navigation', () => ({
  useReminderNavigation: jest.fn(),
}));
jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: () => Promise.resolve(true),
  hideAsync: () => Promise.resolve(true),
}));

const useSessionMock = jest.mocked(useSession);

const routes = {
  _layout: RootLayout,
  index: () => <Redirect href="/hoy" />,
  login: () => <Text>Login screen</Text>,
  '(tabs)/_layout':
    jest.requireActual<typeof import('expo-router')>('expo-router').Slot,
  '(tabs)/hoy': () => <Text>Today screen</Text>,
  ajustes: () => <Text>Settings screen</Text>,
  '(dev)/catalog': () => <Text>Catalog screen</Text>,
};

function mockSession(session: Session | null, isLoading = false) {
  useSessionMock.mockReturnValue({ session, isLoading });
}

describe('Screen protection', () => {
  afterEach(() => {
    useSessionMock.mockReset();
  });

  it('shows only the login when there is no session', async () => {
    mockSession(null);

    renderRouter(routes, { initialUrl: '/hoy' });

    expect(await screen.findByText('Login screen')).toBeTruthy();
    expect(screen.queryByText('Today screen')).toBeNull();
  });

  it('sends the user to Today when there is a session', async () => {
    mockSession({ access_token: 'token' } as Session);

    renderRouter(routes, { initialUrl: '/login' });

    expect(await screen.findByText('Today screen')).toBeTruthy();
    expect(screen.queryByText('Login screen')).toBeNull();
  });

  it('sends the user to the login when opening Settings without a session', async () => {
    mockSession(null);

    renderRouter(routes, { initialUrl: '/ajustes' });

    expect(await screen.findByText('Login screen')).toBeTruthy();
    expect(screen.queryByText('Settings screen')).toBeNull();
  });

  it('sends the user to the login when opening the catalog without a session', async () => {
    mockSession(null);

    renderRouter(routes, { initialUrl: '/catalog' });

    expect(await screen.findByText('Login screen')).toBeTruthy();
    expect(screen.queryByText('Catalog screen')).toBeNull();
  });

  it('shows Settings when there is a session', async () => {
    mockSession({ access_token: 'token' } as Session);

    renderRouter(routes, { initialUrl: '/ajustes' });

    expect(await screen.findByText('Settings screen')).toBeTruthy();
  });

  it('shows nothing while the stored session is being checked', async () => {
    mockSession(null, true);

    renderRouter(routes, { initialUrl: '/hoy' });

    expect(screen.queryByText('Login screen')).toBeNull();
    expect(screen.queryByText('Today screen')).toBeNull();
  });
});

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import type { SupabaseClient, SupportedStorage } from '@supabase/supabase-js';

import {
  createAppSupabaseClient,
  type AppSupabaseClient,
} from './create-client';
import {
  waitForLocalSchema,
  createAdminClient,
  createAnonymousClient,
  createTestUser,
  deleteTestUser,
  readLocalSupabaseSettings,
  type TestUser,
} from './local-supabase';

// Un almacenamiento que sobrevive a crear otro cliente, como lo haría el
// disco del dispositivo al cerrar y abrir la app.
function createMemoryStorage(): SupportedStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

function openApp(storage: SupportedStorage) {
  const { url, anonKey } = readLocalSupabaseSettings();
  return createAppSupabaseClient({
    url,
    anonKey,
    storage,
    autoRefreshToken: false,
  });
}

let adminClient: SupabaseClient;
let user: TestUser;

beforeAll(async () => {
  await waitForLocalSchema();
  adminClient = createAdminClient();
  user = await createTestUser(adminClient);
}, 35000);

afterAll(async () => {
  await deleteTestUser(adminClient, user);
});

async function signIn(client: AppSupabaseClient) {
  const response = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });
  expect(response.error).toBeNull();
}

describe('Session storage', () => {
  it('keeps the session when the app is closed and opened again', async () => {
    const storage = createMemoryStorage();
    await signIn(openApp(storage));

    const secondOpening = openApp(storage);
    const restored = await secondOpening.auth.getSession();

    expect(restored.data.session?.user.id).toBe(user.id);
  });

  it('starts without session after signing out', async () => {
    const storage = createMemoryStorage();
    const firstOpening = openApp(storage);
    await signIn(firstOpening);
    await firstOpening.auth.signOut({ scope: 'local' });

    const secondOpening = openApp(storage);
    const restored = await secondOpening.auth.getSession();

    expect(restored.data.session).toBeNull();
  });

  it('starts without session when nothing was stored', async () => {
    const client = openApp(createMemoryStorage());

    const restored = await client.auth.getSession();

    expect(restored.data.session).toBeNull();
  });
});

describe('Email sign-in', () => {
  it('signs in with the right password', async () => {
    const client = openApp(createMemoryStorage());

    const response = await client.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    });

    expect(response.error).toBeNull();
    expect(response.data.session?.user.id).toBe(user.id);
  });

  it('keeps a real session when the app is closed and opened again', async () => {
    const storage = createMemoryStorage();
    await openApp(storage).auth.signInWithPassword({
      email: user.email,
      password: user.password,
    });

    const restored = await openApp(storage).auth.getSession();

    expect(restored.data.session?.user.id).toBe(user.id);
  });

  it('refreshes a restored real session and persists the renewed tokens', async () => {
    const storage = createMemoryStorage();
    await signIn(openApp(storage));
    const reopened = openApp(storage);
    const original = await reopened.auth.getSession();
    const refreshed = await reopened.auth.refreshSession();

    expect(refreshed.error).toBeNull();
    expect(refreshed.data.session?.user.id).toBe(user.id);
    expect(refreshed.data.session?.refresh_token).toEqual(expect.any(String));
    expect(refreshed.data.session?.refresh_token).not.toBe(
      original.data.session?.refresh_token,
    );
    const restored = await openApp(storage).auth.getSession();
    expect(restored.data.session?.access_token).toBe(
      refreshed.data.session?.access_token,
    );
    expect(restored.data.session?.refresh_token).toBe(
      refreshed.data.session?.refresh_token,
    );
    const verified = await reopened.auth.getUser();
    expect(verified.error).toBeNull();
    expect(verified.data.user?.id).toBe(user.id);
  });

  it('keeps public signup disabled in the server settings', async () => {
    const { url, anonKey } = readLocalSupabaseSettings();
    const response = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: anonKey },
    });
    expect(response.ok).toBe(true);
    const settings = await response.json();
    expect(settings.disable_signup).toBe(true);
    expect(settings.external.email).toBe(true);
  });

  it('rejects a wrong password with the invalid_credentials code', async () => {
    const client = openApp(createMemoryStorage());

    const response = await client.auth.signInWithPassword({
      email: user.email,
      password: 'x'.repeat(12),
    });

    expect(response.error?.code).toBe('invalid_credentials');
  });

  it('rejects public sign up with the signup_disabled code', async () => {
    const anonymousClient = createAnonymousClient();

    const response = await anonymousClient.auth.signUp({
      email: 'stranger@example.test',
      password: 'x'.repeat(12),
    });

    expect(response.error?.code).toBe('signup_disabled');
  });
});

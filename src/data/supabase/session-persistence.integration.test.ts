import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import type { SupabaseClient, SupportedStorage } from '@supabase/supabase-js';

import {
  createAppSupabaseClient,
  type AppSupabaseClient,
} from './create-client';
import {
  createAdminClient,
  createAnonymousClient,
  createTestUser,
  deleteTestUser,
  readLocalSupabaseSettings,
  signAccessToken,
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
  adminClient = createAdminClient();
  user = await createTestUser(adminClient);
});

afterAll(async () => {
  await deleteTestUser(adminClient, user);
});

async function signIn(client: AppSupabaseClient) {
  // El inicio de sesión por email no está activo en local (ver el PR): se
  // entra con un token firmado, que sigue el mismo camino de guardado.
  const response = await client.auth.setSession({
    access_token: signAccessToken(user.id),
    refresh_token: 'refresh-token-for-tests',
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

// PENDIENTE DEL HUMANO: con `[auth.email] enable_signup = false` el Supabase
// local rechaza el inicio de sesión ("Email logins are disabled"). Al aprobar
// poner `enable_signup = true` en [auth.email] (el alta sigue cerrada por
// [auth]), cambiar `describe.skip` por `describe` y comprobar que pasan.
describe.skip('Email sign-in (blocked until [auth.email] is enabled)', () => {
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

  it('rejects a wrong password with the invalid_credentials code', async () => {
    const client = openApp(createMemoryStorage());

    const response = await client.auth.signInWithPassword({
      email: user.email,
      password: 'not-the-password',
    });

    expect(response.error?.code).toBe('invalid_credentials');
  });

  it('rejects public sign up with the signup_disabled code', async () => {
    const anonymousClient = createAnonymousClient();

    const response = await anonymousClient.auth.signUp({
      email: 'stranger@example.test',
      password: 'a-long-enough-password',
    });

    expect(response.error?.code).toBe('signup_disabled');
  });
});

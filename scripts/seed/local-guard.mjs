// El borrado queda limitado al destino elegido; producción se rechaza siempre.
const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1', '[::1]'];
export const PRUEBAS_PROJECT_REF = 'oxkjbousfzkpkcrxdhqj';
const PRUEBAS_HOSTNAME = `${PRUEBAS_PROJECT_REF}.supabase.co`;
const PRODUCTION_HOSTNAME = 'cidrlwpsqkygnuxiffsu.supabase.co';

function parseApiUrl(apiUrl) {
  try {
    return new URL(apiUrl);
  } catch {
    // No se incluye la entrada: podría llevar credenciales.
    throw new Error('The API URL is not valid');
  }
}

function assertNotProduction(url) {
  if (url.hostname === PRODUCTION_HOSTNAME) {
    throw new Error(
      'Refusing to seed production: production is always forbidden',
    );
  }
}

export function assertLocalApiUrl(apiUrl) {
  const url = parseApiUrl(apiUrl);
  assertNotProduction(url);
  const isLocal =
    LOCAL_HOSTNAMES.includes(url.hostname) ||
    /^supabase_[a-z0-9_-]+$/i.test(url.hostname);
  if (!isLocal || !['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Refusing to seed: only a local Supabase is allowed');
  }
}

export function assertSeedConfiguration({ apiUrl, target, email, password }) {
  const url = parseApiUrl(apiUrl);
  assertNotProduction(url);
  if (!target || target === 'local') {
    assertLocalApiUrl(apiUrl);
  } else if (target === 'pruebas') {
    const isPruebas =
      url.protocol === 'https:' && url.hostname === PRUEBAS_HOSTNAME;
    const hasExtraUrlParts =
      url.port ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== '/';
    if (!isPruebas || hasExtraUrlParts) {
      throw new Error(
        'SEED_TARGET=pruebas requires the exact pruebas HTTPS API URL',
      );
    }
    if (email !== 'demo@example.com') {
      throw new Error('SEED_TARGET=pruebas requires demo@example.com');
    }
  } else {
    throw new Error('Unknown SEED_TARGET: expected local or pruebas');
  }
  if (!password) {
    throw new Error('SEED_USER_PASSWORD is required');
  }
}

export function assertSeedUser(user, email, userId) {
  if (!user || user.email !== email || user.id !== userId) {
    throw new Error(
      'Refusing to clear data: seed user identity does not match',
    );
  }
}

// Ayudas SOLO para los tests de integración contra el Supabase local real.
// La clave de servicio se lee en tiempo de ejecución y no se guarda en ningún fichero.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { execFileSync } from 'node:child_process';
import { createHmac, randomUUID } from 'node:crypto';

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]'];

export type TestUser = {
  id: string;
  email: string;
  password: string;
  client: SupabaseClient;
};

export function readLocalSupabaseSettings() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Local Supabase environment variables are required');
  }

  const parsedUrl = new URL(url);
  if (!LOCAL_HOSTS.includes(parsedUrl.hostname)) {
    throw new Error('Integration tests require a local Supabase instance');
  }

  return { url, anonKey };
}

// Si la variable de entorno ya trae el valor se usa; si no, se pregunta a `supabase status`.
function readLocalStatusValue(
  name: string,
  valueFromEnvironment: string | undefined,
): string {
  if (valueFromEnvironment) {
    return valueFromEnvironment;
  }

  const statusOutput = execFileSync(
    'npx',
    ['supabase', 'status', '-o', 'env'],
    {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    },
  );
  const valueLine = statusOutput
    .split('\n')
    .find((line) => line.startsWith(`${name}=`));
  if (!valueLine) {
    throw new Error(`Could not read ${name} from the local Supabase`);
  }

  return valueLine.replace(`${name}=`, '').replaceAll('"', '');
}

const clientOptions = {
  auth: { persistSession: false, autoRefreshToken: false },
};

export function createAdminClient(): SupabaseClient {
  const { url } = readLocalSupabaseSettings();
  return createClient(
    url,
    readLocalStatusValue(
      'SERVICE_ROLE_KEY',
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
    clientOptions,
  );
}

export function createAnonymousClient(): SupabaseClient {
  const { url, anonKey } = readLocalSupabaseSettings();
  return createClient(url, anonKey, clientOptions);
}

function encodeBase64Url(value: Buffer | string): string {
  return Buffer.from(value).toString('base64url');
}

// El inicio de sesión por email está desactivado en la configuración local (ver
// el PR), así que el token de acceso se firma con el secreto JWT local, igual
// que lo haría el servidor de autenticación.
export function signAccessToken(userId: string): string {
  const secret = readLocalStatusValue(
    'JWT_SECRET',
    process.env.SUPABASE_JWT_SECRET,
  );
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = encodeBase64Url(
    JSON.stringify({
      aud: 'authenticated',
      role: 'authenticated',
      sub: userId,
      iat: issuedAt,
      exp: issuedAt + 3600,
    }),
  );
  const signature = createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest();

  return `${header}.${payload}.${encodeBase64Url(signature)}`;
}

export function createClientWithAccessToken(
  accessToken: string,
): SupabaseClient {
  const { url, anonKey } = readLocalSupabaseSettings();
  return createClient(url, anonKey, {
    ...clientOptions,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

// Crea un usuario con email confirmado mediante la API de administración (el
// registro público está desactivado) y devuelve un cliente que actúa como él.
export async function createTestUser(
  adminClient: SupabaseClient,
): Promise<TestUser> {
  const email = `user-${randomUUID()}@example.test`;
  const password = randomUUID();

  const creation = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (creation.error) {
    throw creation.error;
  }

  const userId = creation.data.user.id;
  const client = createClientWithAccessToken(signAccessToken(userId));

  return { id: userId, email, password, client };
}

// Borrar el usuario borra en cascada todos sus datos.
export async function deleteTestUser(
  adminClient: SupabaseClient,
  user: TestUser,
): Promise<void> {
  await adminClient.auth.admin.deleteUser(user.id);
}

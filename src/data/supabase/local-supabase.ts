// Ayudas SOLO para los tests de integración contra el Supabase local real.
// La clave de servicio se lee en tiempo de ejecución y no se guarda en ningún fichero.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

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

  const valueWithQuotes = valueLine.replace(`${name}=`, '');
  return valueWithQuotes.replaceAll('"', '');
}

const clientOptions = {
  auth: { persistSession: false, autoRefreshToken: false },
};

export function createAdminClient(): SupabaseClient {
  const { url } = readLocalSupabaseSettings();
  const serviceRoleKey = readLocalStatusValue(
    'SERVICE_ROLE_KEY',
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  return createClient(url, serviceRoleKey, clientOptions);
}

export function createAnonymousClient(): SupabaseClient {
  const { url, anonKey } = readLocalSupabaseSettings();
  return createClient(url, anonKey, clientOptions);
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
  const client = createAnonymousClient();
  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error) {
    await deleteTestUser(adminClient, { id: userId, email, password, client });
    throw signIn.error;
  }

  return { id: userId, email, password, client };
}

// Borrar el usuario borra en cascada todos sus datos.
export async function deleteTestUser(
  adminClient: SupabaseClient,
  user: TestUser,
): Promise<void> {
  const deletion = await adminClient.auth.admin.deleteUser(user.id);
  if (deletion.error) {
    throw new Error(`Could not delete test user: ${deletion.error.message}`);
  }
}

// Ejecuta SQL de solo lectura contra la base de datos local con la CLI de
// Supabase. Sirve para mirar el catálogo de Postgres, que la API REST no expone.
export function queryLocalDatabase(sql: string): Record<string, unknown>[] {
  const output = execFileSync(
    'npx',
    ['supabase', 'db', 'query', '--local', '-o', 'json', sql],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
  );
  return JSON.parse(output);
}

// Tras db reset, PostgREST puede seguir viendo el esquema anterior. La espera
// comprueba las seis tablas antes de crear fixtures; nunca repite un test.
export async function waitForLocalSchema(): Promise<void> {
  const adminClient = createAdminClient();
  const tables = [
    'categories',
    'sections',
    'habits',
    'habit_rules',
    'habit_marks',
    'tasks',
  ];
  const deadline = Date.now() + 30000;
  for (const table of tables) {
    let lastError = '';
    while (Date.now() < deadline) {
      const remainingTime = deadline - Date.now();
      const response = await adminClient
        .from(table)
        .select('user_id', { head: true })
        .limit(0)
        .abortSignal(AbortSignal.timeout(Math.max(1, remainingTime)));
      if (!response.error) {
        lastError = '';
        break;
      }
      lastError = response.error.message;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (lastError || Date.now() >= deadline) {
      throw new Error(
        `Local schema did not become ready for ${table}: ${lastError}`,
      );
    }
  }
}

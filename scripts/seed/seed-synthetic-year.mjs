// Siembra un año de datos sintéticos para un usuario propio en el Supabase LOCAL.
//
// Uso: `./scripts/seed/seed-synthetic-year.sh` (el envoltorio prepara Docker).
// Solo toca los datos del usuario de siembra y los borra antes de escribir,
// así que se puede repetir. Se niega a funcionar si la API no es local.
//
// Variables de entorno:
//   SEED_USER_PASSWORD  (obligatoria) contraseña del usuario de siembra
//   SEED_USER_EMAIL     (opcional) por defecto seed@example.com
//   SEED_TODAY          (opcional) «hoy» como YYYY-MM-DD; por defecto, la fecha
//                       de hoy en la zona horaria del dispositivo
//   SEED_API_URL        (opcional) URL de la API; por defecto, la de `supabase status`
//
// La clave de servicio se lee de `supabase status` en el momento: no se guarda
// en ningún fichero y nunca va en la app.
import { createClient } from '@supabase/supabase-js';
import { execFileSync } from 'node:child_process';

import { getCalendarDateInTimeZone } from './calendar.mjs';
import { generateYear } from './generate-year.mjs';
import { assertLocalApiUrl } from './local-guard.mjs';

const FIXED_SEED = 20261007;
const INSERT_BATCH_SIZE = 1000;
const DEFAULT_EMAIL = 'seed@example.com';

function readStatusValue(statusOutput, name) {
  const valueLine = statusOutput
    .split('\n')
    .find((line) => line.startsWith(`${name}=`));
  if (!valueLine) {
    throw new Error(`Could not read ${name}: is Supabase running?`);
  }
  const valueWithQuotes = valueLine.replace(`${name}=`, '');
  return valueWithQuotes.replaceAll('"', '');
}

function readSupabaseStatus() {
  return execFileSync('npx', ['supabase', 'status', '-o', 'env'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
}

function readToday() {
  if (process.env.SEED_TODAY) {
    return process.env.SEED_TODAY;
  }
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return getCalendarDateInTimeZone(new Date(), timeZone);
}

async function findUserByEmail(adminClient, email) {
  const listing = await adminClient.auth.admin.listUsers({ perPage: 1000 });
  if (listing.error) {
    throw new Error(`Could not list users: ${listing.error.message}`);
  }
  return listing.data.users.find((user) => user.email === email);
}

// Crea el usuario o, si ya existe, le pone la contraseña indicada.
async function ensureSeedUser(adminClient, email, password) {
  const existingUser = await findUserByEmail(adminClient, email);
  if (existingUser) {
    const update = await adminClient.auth.admin.updateUserById(
      existingUser.id,
      { password },
    );
    if (update.error) {
      throw new Error(`Could not update the user: ${update.error.message}`);
    }
    return existingUser.id;
  }
  const creation = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (creation.error) {
    throw new Error(`Could not create the user: ${creation.error.message}`);
  }
  return creation.data.user.id;
}

async function deleteRowsOfUser(adminClient, table, userId) {
  const deletion = await adminClient.from(table).delete().eq('user_id', userId);
  if (deletion.error) {
    throw new Error(`Could not clear ${table}: ${deletion.error.message}`);
  }
}

// Hábitos y tareas referencian la categoría sin «on delete»: van primero.
// Las reglas y las marcas caen en cascada con los hábitos, y las secciones
// con las categorías.
async function clearUserData(adminClient, userId) {
  await deleteRowsOfUser(adminClient, 'tasks', userId);
  await deleteRowsOfUser(adminClient, 'habits', userId);
  await deleteRowsOfUser(adminClient, 'categories', userId);
}

async function insertInBatches(adminClient, table, rows) {
  for (let first = 0; first < rows.length; first += INSERT_BATCH_SIZE) {
    const batch = rows.slice(first, first + INSERT_BATCH_SIZE);
    const insertion = await adminClient.from(table).insert(batch);
    if (insertion.error) {
      throw new Error(`Could not insert ${table}: ${insertion.error.message}`);
    }
  }
}

async function insertYear(adminClient, year) {
  await insertInBatches(adminClient, 'categories', year.categories);
  await insertInBatches(adminClient, 'sections', year.sections);
  await insertInBatches(adminClient, 'habits', year.habits);
  await insertInBatches(adminClient, 'habit_rules', year.habitRules);
  await insertInBatches(adminClient, 'habit_marks', year.habitMarks);
  await insertInBatches(adminClient, 'tasks', year.tasks);
}

async function countRows(adminClient, table, userId) {
  const response = await adminClient
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (response.error) {
    throw new Error(`Could not count ${table}: ${response.error.message}`);
  }
  return response.count;
}

async function printCounts(adminClient, userId, year) {
  const tables = [
    'categories',
    'sections',
    'habits',
    'habit_rules',
    'habit_marks',
    'tasks',
  ];
  for (const table of tables) {
    const rowCount = await countRows(adminClient, table, userId);
    console.log(`  ${table}: ${rowCount}`);
  }
  console.log(`  habit occurrences in the year: ${year.occurrenceCount}`);
}

async function main() {
  const password = process.env.SEED_USER_PASSWORD;
  if (!password) {
    throw new Error('SEED_USER_PASSWORD is required');
  }
  const email = process.env.SEED_USER_EMAIL ?? DEFAULT_EMAIL;
  const today = readToday();

  // Se comprueba la URL antes de hacer ninguna petición.
  const statusOutput = readSupabaseStatus();
  const apiUrl =
    process.env.SEED_API_URL ?? readStatusValue(statusOutput, 'API_URL');
  assertLocalApiUrl(apiUrl);

  const serviceRoleKey = readStatusValue(statusOutput, 'SERVICE_ROLE_KEY');
  const adminClient = createClient(apiUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const userId = await ensureSeedUser(adminClient, email, password);
  await clearUserData(adminClient, userId);
  const year = generateYear({ userId, today, seed: FIXED_SEED });
  await insertYear(adminClient, year);

  console.log(
    `Datos sintéticos sembrados en el Supabase local para ${email} (hoy: ${today}):`,
  );
  await printCounts(adminClient, userId, year);
}

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

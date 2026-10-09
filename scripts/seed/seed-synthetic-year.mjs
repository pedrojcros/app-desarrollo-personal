// Siembra el perfil year (por defecto) o realistic en el destino permitido.
// La clave de servicio solo vive en memoria; producción se rechaza siempre.
import { createClient } from '@supabase/supabase-js';
import { execFileSync } from 'node:child_process';

import { getCalendarDateInTimeZone } from './calendar.mjs';
import { generateYear } from './generate-year.mjs';
import { generateRealistic } from './generate-realistic.mjs';
import { readPruebasServiceRoleKey } from './credentials.mjs';
import { assertSeedConfiguration, assertSeedUser } from './local-guard.mjs';

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
  try {
    return execFileSync(
      'npx',
      ['--no-install', 'supabase', 'status', '-o', 'env'],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      },
    );
  } catch {
    throw new Error('Could not read local Supabase status');
  }
}

function readToday() {
  if (process.env.SEED_TODAY) {
    return process.env.SEED_TODAY;
  }
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return getCalendarDateInTimeZone(new Date(), timeZone);
}

async function findUserByEmail(adminClient, email) {
  let page = 1;
  while (true) {
    const listing = await adminClient.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (listing.error) {
      throw new Error('Could not list users');
    }
    const matchingUser = listing.data.users.find(
      (user) => user.email === email,
    );
    if (matchingUser) {
      return matchingUser;
    }
    if (listing.data.users.length < 1000) {
      return undefined;
    }
    page += 1;
  }
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
      throw new Error('Could not update the user');
    }
    return existingUser.id;
  }
  const creation = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (creation.error) {
    throw new Error('Could not create the user');
  }
  return creation.data.user.id;
}

async function deleteRowsOfUser(adminClient, table, userId) {
  const deletion = await adminClient.from(table).delete().eq('user_id', userId);
  if (deletion.error) {
    throw new Error(`Could not clear ${table}`);
  }
}

// Hábitos y tareas referencian la categoría sin «on delete»: van primero.
// Las reglas y las marcas caen en cascada con los hábitos, y las secciones
// con las categorías.
async function clearUserData(adminClient, userId, email) {
  const lookup = await adminClient.auth.admin.getUserById(userId);
  if (lookup.error) {
    throw new Error('Could not verify seed user identity');
  }
  assertSeedUser(lookup.data.user, email, userId);
  await deleteRowsOfUser(adminClient, 'tasks', userId);
  await deleteRowsOfUser(adminClient, 'habits', userId);
  await deleteRowsOfUser(adminClient, 'categories', userId);
}

async function insertInBatches(adminClient, table, rows) {
  for (let first = 0; first < rows.length; first += INSERT_BATCH_SIZE) {
    const batch = rows.slice(first, first + INSERT_BATCH_SIZE);
    const insertion = await adminClient.from(table).insert(batch);
    if (insertion.error) {
      throw new Error(`Could not insert ${table}`);
    }
  }
}

async function insertData(adminClient, data) {
  await insertInBatches(adminClient, 'categories', data.categories);
  await insertInBatches(adminClient, 'sections', data.sections);
  await insertInBatches(adminClient, 'habits', data.habits);
  await insertInBatches(adminClient, 'habit_rules', data.habitRules);
  await insertInBatches(adminClient, 'habit_marks', data.habitMarks);
  await insertInBatches(adminClient, 'tasks', data.tasks);
}

async function countRows(adminClient, table, userId) {
  const response = await adminClient
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (response.error) {
    throw new Error(`Could not count ${table}`);
  }
  return response.count;
}

async function printCounts(adminClient, userId, data) {
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
  console.log(`  habit occurrences: ${data.occurrenceCount}`);
}

async function main() {
  const target = process.env.SEED_TARGET || 'local';
  const profile = process.env.SEED_PROFILE || 'year';
  const password = process.env.SEED_USER_PASSWORD;
  const defaultEmail =
    target === 'pruebas' ? 'demo@example.com' : DEFAULT_EMAIL;
  const email = process.env.SEED_USER_EMAIL ?? defaultEmail;
  const today = readToday();

  // La validación precede a la obtención de claves y a toda escritura.
  let statusOutput;
  let apiUrl = process.env.SEED_API_URL;
  if (!apiUrl && target === 'local') {
    statusOutput = readSupabaseStatus();
    apiUrl = readStatusValue(statusOutput, 'API_URL');
  }
  assertSeedConfiguration({ apiUrl, target, email, password });
  if (!['year', 'realistic'].includes(profile)) {
    throw new Error('Unknown SEED_PROFILE: expected year or realistic');
  }

  let serviceRoleKey;
  if (target === 'pruebas') {
    serviceRoleKey = readPruebasServiceRoleKey({
      accessToken: process.env.SUPABASE_ACCESS_TOKEN,
      isActions: process.env.GITHUB_ACTIONS === 'true',
    });
  } else {
    statusOutput ??= readSupabaseStatus();
    serviceRoleKey = readStatusValue(statusOutput, 'SERVICE_ROLE_KEY');
  }
  const adminClient = createClient(apiUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const userId = await ensureSeedUser(adminClient, email, password);
  const generateProfile = profile === 'year' ? generateYear : generateRealistic;
  const data = generateProfile({ userId, today, seed: FIXED_SEED });
  await clearUserData(adminClient, userId, email);
  await insertData(adminClient, data);

  console.log(
    `Datos sintéticos ${profile} sembrados en ${target} para ${email} (hoy: ${today}):`,
  );
  await printCounts(adminClient, userId, data);
}

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

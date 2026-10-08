import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const email = 'e2e@app-desarrollo-personal.local';
const password = randomBytes(32).toString('base64url');
const statusOutput = execFileSync('npx', ['supabase', 'status', '-o', 'env'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'ignore'],
});

function readStatusValue(name) {
  const valueLine = statusOutput
    .split('\n')
    .find((line) => line.startsWith(`${name}=`));
  if (valueLine === undefined) {
    throw new Error(`Could not read ${name}: is Supabase running?`);
  }
  return valueLine.slice(name.length + 1).replaceAll('"', '');
}

const apiUrl = new URL(readStatusValue('API_URL'));
const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
if (!localHosts.has(apiUrl.hostname)) {
  throw new Error('E2E setup only supports a local Supabase API');
}

const serviceRoleKey = readStatusValue('SERVICE_ROLE_KEY');
const adminUrl = `${apiUrl.origin}/auth/v1/admin/users`;
const headers = {
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  'Content-Type': 'application/json',
};
const usersResponse = await fetch(`${adminUrl}?page=1&per_page=1000`, {
  headers,
});
if (!usersResponse.ok) {
  throw new Error(`Could not list local auth users: ${usersResponse.status}`);
}
const usersResult = await usersResponse.json();
const users = usersResult.users ?? [];
const existingUser = users.find((user) => user.email === email);

if (existingUser !== undefined) {
  const deleteResponse = await fetch(`${adminUrl}/${existingUser.id}`, {
    method: 'DELETE',
    headers,
  });
  if (!deleteResponse.ok) {
    throw new Error(`Could not clear the E2E user: ${deleteResponse.status}`);
  }
}

const createResponse = await fetch(adminUrl, {
  method: 'POST',
  headers,
  body: JSON.stringify({ email, password, email_confirm: true }),
});
if (!createResponse.ok) {
  throw new Error(`Could not create the E2E user: ${createResponse.status}`);
}
const createdUser = await createResponse.json();

function getYesterdayInMadrid() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === 'year').value);
  const month = Number(parts.find((part) => part.type === 'month').value);
  const day = Number(parts.find((part) => part.type === 'day').value);
  const yesterday = new Date(Date.UTC(year, month - 1, day - 1));
  return yesterday.toISOString().slice(0, 10);
}

const fixtureResponse = await fetch(`${apiUrl.origin}/rest/v1/tasks`, {
  method: 'POST',
  headers: { ...headers, Prefer: 'return=minimal' },
  body: JSON.stringify({
    user_id: createdUser.id,
    name: 'E2E pendiente',
    due_date: getYesterdayInMadrid(),
  }),
});
if (!fixtureResponse.ok) {
  throw new Error(
    `Could not prepare the pending task: ${fixtureResponse.status}`,
  );
}

process.stdout.write(password);

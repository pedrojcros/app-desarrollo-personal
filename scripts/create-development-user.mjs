// Crea (o actualiza) el usuario del dueño en el Supabase LOCAL.
//
// Uso, con Supabase arrancado: `./scripts/create-development-user.sh`.
// El envoltorio pasa las credenciales al contenedor (`docker/app/run` no
// reenvía las variables del anfitrión).
//
// El registro público está desactivado, así que se usa la API de administración.
// La clave de servicio se lee de `supabase status` en el momento: no se guarda
// en ningún fichero y nunca va en la app.
import { execFileSync } from 'node:child_process';

const email = process.env.DEV_USER_EMAIL;
const password = process.env.DEV_USER_PASSWORD;
if (!email || !password) {
  throw new Error('DEV_USER_EMAIL and DEV_USER_PASSWORD are required');
}

const statusOutput = execFileSync('npx', ['supabase', 'status', '-o', 'env'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'ignore'],
});

function readStatusValue(name) {
  const valueLine = statusOutput
    .split('\n')
    .find((line) => line.startsWith(`${name}=`));
  if (!valueLine) {
    throw new Error(`Could not read ${name}: is Supabase running?`);
  }
  const valueWithQuotes = valueLine.replace(`${name}=`, '');
  return valueWithQuotes.replaceAll('"', '');
}

const apiUrl = readStatusValue('API_URL');
const serviceRoleKey = readStatusValue('SERVICE_ROLE_KEY');

const response = await fetch(`${apiUrl}/auth/v1/admin/users`, {
  method: 'POST',
  headers: {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email, password, email_confirm: true }),
});

if (!response.ok) {
  const body = await response.json();
  throw new Error(`Could not create the user: ${body.msg ?? response.status}`);
}

console.log(`Usuario creado en el Supabase local: ${email}`);

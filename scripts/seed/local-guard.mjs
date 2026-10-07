// El script de datos sintéticos borra y reescribe los datos de un usuario:
// solo puede apuntar a un Supabase local, nunca a pruebas ni a producción.
const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1', '[::1]'];
const SUPABASE_CONTAINER_PREFIX = 'supabase_';

function isLocalHostname(hostname) {
  if (LOCAL_HOSTNAMES.includes(hostname)) {
    return true;
  }
  return hostname.startsWith(SUPABASE_CONTAINER_PREFIX);
}

export function assertLocalApiUrl(apiUrl) {
  let hostname;
  try {
    hostname = new URL(apiUrl).hostname;
  } catch {
    throw new Error(`The API URL is not valid: ${apiUrl}`);
  }
  if (!isLocalHostname(hostname)) {
    throw new Error(
      `Refusing to seed ${hostname}: only a local Supabase is allowed`,
    );
  }
}

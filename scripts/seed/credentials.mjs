import { execFileSync } from 'node:child_process';
import { PRUEBAS_PROJECT_REF } from './local-guard.mjs';

export function readPruebasServiceRoleKey({
  accessToken,
  isActions = false,
  runCommand = execFileSync,
  maskKey = console.log,
}) {
  if (!accessToken) {
    throw new Error('SUPABASE_ACCESS_TOKEN is required for pruebas');
  }
  let keys;
  try {
    const output = runCommand(
      'npx',
      [
        '--no-install',
        'supabase',
        'projects',
        'api-keys',
        '--project-ref',
        PRUEBAS_PROJECT_REF,
        '-o',
        'json',
      ],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        env: { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken },
      },
    );
    keys = JSON.parse(output);
  } catch {
    // execFileSync incluye stdout en su error: nunca se propaga esa salida.
    throw new Error('Could not obtain the pruebas service role key');
  }
  if (!Array.isArray(keys)) {
    throw new Error('Invalid API keys response');
  }
  const serviceKey = keys.find((key) => key.name === 'service_role');
  if (
    !serviceKey ||
    typeof serviceKey.api_key !== 'string' ||
    !serviceKey.api_key
  ) {
    throw new Error('The pruebas service role key is missing');
  }
  const value = serviceKey.api_key;
  if (isActions) {
    const escapedValue = value
      .replaceAll('%', '%25')
      .replaceAll('\r', '%0D')
      .replaceAll('\n', '%0A');
    maskKey(`::add-mask::${escapedValue}`);
  }
  return value;
}

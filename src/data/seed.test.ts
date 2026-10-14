import { describe, expect, it } from '@jest/globals';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function runModule(source: string) {
  return execFileSync('node', ['--input-type=module'], {
    encoding: 'utf8',
    input: source,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

function validateConfiguration(configuration: Record<string, string>) {
  const source = `
    import { assertSeedConfiguration } from './scripts/seed/local-guard.mjs';
    try {
      assertSeedConfiguration(${JSON.stringify(configuration)});
      console.log('accepted');
    } catch (error) {
      console.log(error.message);
    }
  `;
  return runModule(source).trim();
}

const pruebasUrl = 'https://oxkjbousfzkpkcrxdhqj.supabase.co';
const productionUrl = 'https://cidrlwpsqkygnuxiffsu.supabase.co';

describe('seed destination protection', () => {
  const password = randomUUID();
  const demo = { target: 'pruebas', email: 'demo@example.com', password };

  it.each([
    'http://localhost:54321',
    'http://127.0.0.1:54321',
    'http://[::1]:54321',
    'http://supabase_kong_local:8000',
  ])('accepts local %s', (apiUrl) => {
    expect(validateConfiguration({ apiUrl, password })).toBe('accepted');
  });

  it('accepts only the explicit pruebas destination', () => {
    expect(validateConfiguration({ ...demo, apiUrl: pruebasUrl })).toBe(
      'accepted',
    );
    expect(validateConfiguration({ apiUrl: pruebasUrl, password })).toContain(
      'only a local Supabase',
    );
  });

  it.each(['', 'local', 'pruebas', 'unknown'])(
    'always rejects production for target %s',
    (target) => {
      expect(
        validateConfiguration({ ...demo, target, apiUrl: productionUrl }),
      ).toContain('production');
    },
  );

  it.each(['', 'local', 'pruebas', 'unknown'])(
    'reports production for a trailing-dot hostname with target %s',
    (target) => {
      const configuration = { ...demo, target, apiUrl: productionUrl };
      const result = validateConfiguration({
        ...configuration,
        apiUrl: `${productionUrl}.`,
      });
      expect(result).toBe(validateConfiguration(configuration));
      expect(result).toContain('production');
    },
  );

  it.each([
    'https://example.supabase.co',
    'http://oxkjbousfzkpkcrxdhqj.supabase.co',
    `${pruebasUrl}:444`,
    `${pruebasUrl}.evil.test`,
    `${pruebasUrl}/other`,
  ])('rejects an unsafe pruebas URL %s', (apiUrl) => {
    expect(validateConfiguration({ ...demo, apiUrl })).not.toBe('accepted');
  });

  it('rejects URL credentials without echoing them', () => {
    const apiUrl = `https://user:${password}@oxkjbousfzkpkcrxdhqj.supabase.co`;
    const result = validateConfiguration({ ...demo, apiUrl });
    expect(result).not.toBe('accepted');
    expect(result).not.toContain(password);
  });

  it('rejects a remote domain disguised as a container', () => {
    expect(
      validateConfiguration({
        apiUrl: 'https://supabase_fake.example.com',
        target: 'local',
        password,
      }),
    ).toContain('only a local Supabase');
  });

  it('rejects an unknown target even locally', () => {
    expect(
      validateConfiguration({
        apiUrl: 'http://localhost:54321',
        target: 'unknown',
        password,
      }),
    ).toContain('SEED_TARGET');
  });

  it('requires the demo email in pruebas', () => {
    expect(
      validateConfiguration({
        ...demo,
        apiUrl: pruebasUrl,
        email: 'owner@example.com',
      }),
    ).toContain('demo@example.com');
  });

  it('requires a password without including its value in errors', () => {
    expect(
      validateConfiguration({ ...demo, apiUrl: pruebasUrl, password: '' }),
    ).toContain('SEED_USER_PASSWORD');
  });
});

describe('seed user ownership', () => {
  it('refuses to clear an id belonging to a different email or user', () => {
    const output = runModule(`
      import { assertSeedUser } from './scripts/seed/local-guard.mjs';
      const user = { id: 'demo-id', email: 'demo@example.com' };
      assertSeedUser(user, 'demo@example.com', 'demo-id');
      for (const [email, userId] of [['owner@example.com', 'demo-id'], ['demo@example.com', 'owner-id']]) {
        try {
          assertSeedUser(user, email, userId);
          console.log('accepted');
        } catch {
          console.log('refused');
        }
      }
    `);
    expect(output.trim()).toBe('refused\nrefused');
  });
});

describe('remote key retrieval', () => {
  it('selects service_role in memory and masks it before use in Actions', () => {
    const output = runModule(`
      import { readPruebasServiceRoleKey } from './scripts/seed/credentials.mjs';
      const key = crypto.randomUUID();
      const runCommand = (command, argumentsList, options) => {
        const commandArguments = argumentsList.join(' ');
        if (command !== 'npx' || commandArguments !== '--no-install supabase projects api-keys --project-ref oxkjbousfzkpkcrxdhqj -o json') {
          throw new Error('Unexpected command');
        }
        const outputStreams = options.stdio.join(' ');
        if (outputStreams !== 'ignore pipe ignore') {
          throw new Error('Unsafe output');
        }
        return JSON.stringify([{ name: 'anon', api_key: crypto.randomUUID() }, { name: 'service_role', api_key: key }]);
      };
      const messages = [];
      const result = readPruebasServiceRoleKey({
        accessToken: crypto.randomUUID(),
        isActions: true,
        runCommand,
        maskKey: (message) => messages.push(message),
      });
      console.log(result === key && messages[0] === '::add-mask::' + key ? 'safe' : 'unsafe');
    `);
    expect(output.trim()).toBe('safe');
  });

  it('fails without a token or usable service key and hides command failures', () => {
    const output = runModule(`
      import { readPruebasServiceRoleKey } from './scripts/seed/credentials.mjs';
      const secret = crypto.randomUUID();
      for (const options of [
        { accessToken: '', runCommand: () => { throw new Error(secret); } },
        { accessToken: secret, runCommand: () => '[]' },
        { accessToken: secret, runCommand: () => { throw new Error(secret); } }
      ]) {
        try {
          readPruebasServiceRoleKey(options);
          console.log('accepted');
        } catch (error) {
          const leakedSecret = error.message.includes(secret);
          console.log(leakedSecret ? 'leaked' : 'refused');
        }
      }
    `);
    expect(output.trim()).toBe('refused\nrefused\nrefused');
  });
});

describe('seed entry point safety', () => {
  it.each([
    {
      target: 'local',
      apiUrl: pruebasUrl,
      email: 'demo@example.com',
      password: true,
      expected: 'only a local Supabase',
    },
    {
      target: 'pruebas',
      apiUrl: productionUrl,
      email: 'demo@example.com',
      password: true,
      expected: 'production',
    },
    {
      target: 'pruebas',
      apiUrl: pruebasUrl,
      email: 'owner@example.com',
      password: true,
      expected: 'demo@example.com',
    },
    {
      target: 'pruebas',
      apiUrl: pruebasUrl,
      email: 'demo@example.com',
      password: false,
      expected: 'SEED_USER_PASSWORD',
    },
    {
      target: 'unknown',
      apiUrl: 'http://localhost:54321',
      email: 'seed@example.com',
      password: true,
      expected: 'SEED_TARGET',
    },
  ])('refuses $expected before retrieving keys or writing', (configuration) => {
    const output = runModule(`
      import { mkdtempSync, writeFileSync, existsSync, rmSync } from 'node:fs';
      import { tmpdir } from 'node:os';
      import { join } from 'node:path';
      import { spawnSync } from 'node:child_process';
      const directoryPrefix = join(tmpdir(), 'seed-safety-');
      const directory = mkdtempSync(directoryPrefix);
      const marker = join(directory, 'cli-called');
      writeFileSync(join(directory, 'npx'), '#!/bin/sh\\ntouch "' + marker + '"\\nexit 1\\n', { mode: 0o700 });
      try {
        const password = ${configuration.password} ? crypto.randomUUID() : '';
        const result = spawnSync(process.execPath, ['scripts/seed/seed-synthetic-year.mjs'], {
          encoding: 'utf8',
          env: {
            ...process.env,
            PATH: directory + ':' + process.env.PATH,
            SEED_TARGET: '${configuration.target}',
            SEED_API_URL: '${configuration.apiUrl}',
            SEED_USER_EMAIL: '${configuration.email}',
            SEED_USER_PASSWORD: password,
            SUPABASE_ACCESS_TOKEN: crypto.randomUUID(),
            SEED_PROFILE: 'realistic',
          }
        });
        const observation = {
          status: result.status,
          error: result.stderr.trim(),
          calledCli: existsSync(marker),
          leaked: password !== '' && result.stderr.includes(password),
        };
        console.log(JSON.stringify(observation));
      } finally {
        rmSync(directory, { recursive: true });
      }
    `);
    const result = JSON.parse(output);
    expect(result.status).toBe(1);
    expect(result.error).toContain(configuration.expected);
    expect(result.calledCli).toBe(false);
    expect(result.leaked).toBe(false);
  });
});

describe('seed shell wrapper today', () => {
  it.each([
    { target: 'pruebas', today: '', expected: '2026-10-11' },
    { target: 'local', today: '', expected: '2026-10-10' },
    { target: '', today: '', expected: '2026-10-10' },
    { target: 'pruebas', today: '2026-01-02', expected: '2026-01-02' },
    { target: 'local', today: '2026-01-02', expected: '2026-01-02' },
  ])(
    'passes $expected for target $target and today "$today"',
    (configuration) => {
      const directory = mkdtempSync(join(tmpdir(), 'seed-wrapper-'));
      try {
        writeFileSync(
          join(directory, 'docker'),
          '#!/bin/sh\nprintenv SEED_TODAY\n',
          { mode: 0o700 },
        );
        // Simula la medianoche madrileña mientras el anfitrión sigue en el día anterior.
        writeFileSync(
          join(directory, 'date'),
          '#!/bin/sh\nif [ "${TZ:-}" = Europe/Madrid ]; then\n  echo 2026-10-11\nelse\n  echo 2026-10-10\nfi\n',
          { mode: 0o700 },
        );
        const output = execFileSync(
          'sh',
          ['scripts/seed/seed-synthetic-year.sh'],
          {
            encoding: 'utf8',
            env: {
              ...process.env,
              PATH: `${directory}:${process.env.PATH}`,
              TZ: 'UTC',
              SEED_TARGET: configuration.target,
              SEED_TODAY: configuration.today,
              SEED_USER_PASSWORD: randomUUID(),
            },
          },
        );
        expect(output.trim()).toBe(configuration.expected);
      } finally {
        rmSync(directory, { recursive: true });
      }
    },
  );
});

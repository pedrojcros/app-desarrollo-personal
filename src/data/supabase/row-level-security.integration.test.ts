import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

import {
  createAdminClient,
  createAnonymousClient,
  createTestUser,
  deleteTestUser,
  queryLocalDatabase,
  type TestUser,
} from './local-supabase';

type TableName =
  | 'categories'
  | 'sections'
  | 'habits'
  | 'habit_rules'
  | 'habit_marks'
  | 'tasks';

type Row = Record<string, string>;

// Qué columnas identifican una fila de cada tabla y qué cambio intentar en ella.
const TABLES: Record<TableName, { keyColumns: string[]; change: Row }> = {
  categories: { keyColumns: ['id'], change: { name: 'Hijacked' } },
  sections: { keyColumns: ['id'], change: { name: 'Hijacked' } },
  habits: { keyColumns: ['id'], change: { name: 'Hijacked' } },
  habit_rules: { keyColumns: ['id'], change: { frequency: 'monthly' } },
  habit_marks: {
    keyColumns: ['habit_id', 'occurrence_date'],
    change: { status: 'not_done' },
  },
  tasks: { keyColumns: ['id'], change: { name: 'Hijacked' } },
};

const TABLE_NAMES = Object.keys(TABLES) as TableName[];

const RLS_VIOLATION = '42501';

let adminClient: SupabaseClient;
let owner: TestUser;
let intruder: TestUser;

async function insertAndReturn(
  client: SupabaseClient,
  table: TableName,
  payload: Row,
): Promise<Row> {
  const insertion = client.from(table).insert(payload);
  const response = await insertion.select().single();
  if (response.error) {
    throw new Error(
      `Could not insert into ${table}: ${response.error.message}`,
    );
  }
  return response.data;
}

// Crea una fila de la tabla pedida, con solo los padres que necesita. Cada
// llamada crea filas nuevas, así que ningún test depende de lo que hizo otro.
async function createRow(user: TestUser, table: TableName): Promise<Row> {
  const uniqueName = `Name ${randomUUID()}`;
  if (table === 'categories') {
    return insertAndReturn(user.client, 'categories', { name: uniqueName });
  }
  if (table === 'tasks') {
    return insertAndReturn(user.client, 'tasks', { name: uniqueName });
  }
  if (table === 'sections') {
    const category = await createRow(user, 'categories');
    return insertAndReturn(user.client, 'sections', {
      category_id: category.id,
      name: uniqueName,
    });
  }

  const habit = await insertAndReturn(user.client, 'habits', {
    name: uniqueName,
    start_date: '2026-10-01',
  });
  if (table === 'habits') {
    return habit;
  }
  if (table === 'habit_rules') {
    return insertAndReturn(user.client, 'habit_rules', {
      habit_id: habit.id,
      valid_from: '2026-10-01',
      frequency: 'daily',
    });
  }
  return insertAndReturn(user.client, 'habit_marks', {
    habit_id: habit.id,
    occurrence_date: '2026-10-02',
    status: 'done',
  });
}

function keyOf(table: TableName, row: Row): Row {
  const keyEntries = TABLES[table].keyColumns.map((column) => [
    column,
    row[column],
  ]);
  return Object.fromEntries(keyEntries);
}

// Lee con la clave de administración, que se salta RLS: dice qué hay de verdad.
async function readRowAsAdmin(table: TableName, row: Row): Promise<Row | null> {
  const response = await adminClient
    .from(table)
    .select()
    .match(keyOf(table, row))
    .maybeSingle();
  expect(response.error).toBeNull();
  return response.data;
}

beforeAll(async () => {
  adminClient = createAdminClient();
  owner = await createTestUser(adminClient);
  intruder = await createTestUser(adminClient);
});

afterAll(async () => {
  await deleteTestUser(adminClient, owner);
  await deleteTestUser(adminClient, intruder);
});

describe.each(TABLE_NAMES)('RLS on %s', (table) => {
  it('lets the owner read their own row', async () => {
    const row = await createRow(owner, table);

    const response = await owner.client
      .from(table)
      .select()
      .match(keyOf(table, row))
      .single();

    expect(response.error).toBeNull();
    expect(response.data).toEqual(row);
    expect(response.data?.user_id).toBe(owner.id);
  });

  it('hides the owner rows from another user', async () => {
    await createRow(owner, table);

    const response = await intruder.client.from(table).select();

    expect(response.error).toBeNull();
    expect(response.data).toEqual([]);
  });

  it('rejects an insert that claims the owner as user_id', async () => {
    const row = await createRow(owner, table);
    const stolenPayload = { ...row, user_id: owner.id };

    const response = await intruder.client.from(table).insert(stolenPayload);

    expect(response.error?.code).toBe(RLS_VIOLATION);
  });

  it('lets the owner update their own row', async () => {
    const row = await createRow(owner, table);

    const response = await owner.client
      .from(table)
      .update(TABLES[table].change)
      .match(keyOf(table, row))
      .select()
      .single();

    expect(response.error).toBeNull();
    expect(response.data).toMatchObject(TABLES[table].change);
  });

  it('does not let another user update the owner row', async () => {
    const row = await createRow(owner, table);

    const response = await intruder.client
      .from(table)
      .update(TABLES[table].change)
      .match(keyOf(table, row))
      .select();

    expect(response.error).toBeNull();
    expect(response.data).toEqual([]);
    expect(await readRowAsAdmin(table, row)).toEqual(row);
  });

  it('does not let another user move a row to themselves', async () => {
    const row = await createRow(owner, table);

    const response = await intruder.client
      .from(table)
      .update({ user_id: intruder.id })
      .match(keyOf(table, row))
      .select();

    expect(response.error).toBeNull();
    expect(response.data).toEqual([]);
    expect(await readRowAsAdmin(table, row)).toEqual(row);
  });

  // Es la barrera `with check` de la política de UPDATE: el dueño sí ve su
  // fila, pero no puede dejarla con el user_id de otro. El error 42501 (y no
  // un 23503 de clave foránea) demuestra que quien la frena es RLS: Postgres
  // comprueba RLS antes que las claves foráneas.
  it('does not let the owner hand their row to another user', async () => {
    const row = await createRow(owner, table);

    const response = await owner.client
      .from(table)
      .update({ user_id: intruder.id })
      .match(keyOf(table, row))
      .select();

    expect(response.error?.code).toBe(RLS_VIOLATION);
    const rowAfterAttempt = await readRowAsAdmin(table, row);
    expect(rowAfterAttempt?.user_id).toBe(owner.id);
  });

  it('lets the owner delete their own row', async () => {
    const row = await createRow(owner, table);

    const response = await owner.client
      .from(table)
      .delete()
      .match(keyOf(table, row))
      .select();

    expect(response.error).toBeNull();
    expect(response.data).toHaveLength(1);
    expect(await readRowAsAdmin(table, row)).toBeNull();
  });

  it('does not let another user delete the owner row', async () => {
    const row = await createRow(owner, table);

    const response = await intruder.client
      .from(table)
      .delete()
      .match(keyOf(table, row))
      .select();

    expect(response.error).toBeNull();
    expect(response.data).toEqual([]);
    expect(await readRowAsAdmin(table, row)).toEqual(row);
  });

  it('does not delete the owner rows on a delete without a key filter', async () => {
    const row = await createRow(owner, table);
    await createRow(intruder, table);

    // Un filtro que casa con todo lo que el intruso puede ver, sin `select()`.
    const response = await intruder.client
      .from(table)
      .delete()
      .not('user_id', 'is', null);

    expect(response.error).toBeNull();
    expect(await readRowAsAdmin(table, row)).toEqual(row);
  });

  it('gives no access at all without a session', async () => {
    const row = await createRow(owner, table);
    const anonymousClient = createAnonymousClient();

    const readResponse = await anonymousClient.from(table).select();
    const insertResponse = await anonymousClient.from(table).insert(row);

    expect(readResponse.error?.code).toBe(RLS_VIOLATION);
    expect(insertResponse.error?.code).toBe(RLS_VIOLATION);
  });
});

describe('RLS configuration in the catalog', () => {
  const OWN_ROWS_EXPRESSION = '(user_id = ( SELECT auth.uid() AS uid))';
  // Código de operación de pg_policy: r = select, a = insert, w = update, d = delete.
  const COMMAND_CODES = ['r', 'a', 'w', 'd'];

  it('enables and forces RLS on the six tables', () => {
    const tables = queryLocalDatabase(
      `select relname, relrowsecurity, relforcerowsecurity from pg_class
       where relnamespace = 'public'::regnamespace and relkind = 'r'`,
    );

    const tableNames = tables.map((table) => table.relname).sort();
    expect(tableNames).toEqual([...TABLE_NAMES].sort());
    for (const table of tables) {
      expect(table).toMatchObject({
        relrowsecurity: true,
        relforcerowsecurity: true,
      });
    }
  });

  it('has 24 policies, four per table, all for authenticated and user_id = (select auth.uid())', () => {
    const policies = queryLocalDatabase(
      `select relname as table_name, polcmd,
              polroles::regrole[]::text as roles,
              pg_get_expr(polqual, polrelid) as using_expression,
              pg_get_expr(polwithcheck, polrelid) as check_expression
       from pg_policy
       join pg_class on pg_class.oid = polrelid
       where relnamespace = 'public'::regnamespace`,
    );

    expect(policies).toHaveLength(24);
    for (const tableName of TABLE_NAMES) {
      const tablePolicies = policies.filter(
        (policy) => policy.table_name === tableName,
      );
      const commands = tablePolicies.map((policy) => policy.polcmd).sort();
      expect(commands).toEqual([...COMMAND_CODES].sort());
      for (const policy of tablePolicies) {
        expect(policy.roles).toBe('{authenticated}');
        const expression = policy.using_expression ?? policy.check_expression;
        expect(expression).toBe(OWN_ROWS_EXPRESSION);
      }
    }
  });

  it('checks the new row on updates and inserts', () => {
    const policies = queryLocalDatabase(
      `select polcmd, pg_get_expr(polwithcheck, polrelid) as check_expression
       from pg_policy
       join pg_class on pg_class.oid = polrelid
       where relnamespace = 'public'::regnamespace and polcmd in ('a', 'w')`,
    );

    expect(policies).toHaveLength(12);
    for (const policy of policies) {
      expect(policy.check_expression).toBe(OWN_ROWS_EXPRESSION);
    }
  });
});

describe('Links between tables', () => {
  it('rejects a habit in a category that belongs to another user', async () => {
    const ownerCategory = await createRow(owner, 'categories');

    const response = await intruder.client.from('habits').insert({
      category_id: ownerCategory.id,
      name: 'Sneaky habit',
      start_date: '2026-10-01',
    });

    expect(response.error?.code).toBe('23503');
  });

  it('rejects a task in a section that belongs to another user', async () => {
    const ownerSection = await createRow(owner, 'sections');
    const intruderCategory = await insertAndReturn(
      intruder.client,
      'categories',
      { name: 'Mine' },
    );

    const response = await intruder.client.from('tasks').insert({
      category_id: intruderCategory.id,
      section_id: ownerSection.id,
      name: 'Sneaky task',
    });

    expect(response.error?.code).toBe('23503');
  });

  it('rejects a mark on a habit that belongs to another user', async () => {
    const ownerHabit = await createRow(owner, 'habits');

    const response = await intruder.client.from('habit_marks').insert({
      habit_id: ownerHabit.id,
      occurrence_date: '2026-10-03',
      status: 'done',
    });

    expect(response.error?.code).toBe('23503');
  });
});

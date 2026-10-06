import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  createAdminClient,
  createAnonymousClient,
  createTestUser,
  deleteTestUser,
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

let adminClient: SupabaseClient;
let owner: TestUser;
let intruder: TestUser;
// Las filas que crea el dueño, una por tabla, tal como las devuelve la base de datos.
const ownerRows = {} as Record<TableName, Row>;

async function insertAndReturn(
  client: SupabaseClient,
  table: TableName,
  payload: Row,
): Promise<Row> {
  const response = await client.from(table).insert(payload).select().single();
  if (response.error) {
    throw new Error(
      `Could not insert into ${table}: ${response.error.message}`,
    );
  }
  return response.data;
}

async function createOwnerRows() {
  const category = await insertAndReturn(owner.client, 'categories', {
    name: 'Home',
  });
  const section = await insertAndReturn(owner.client, 'sections', {
    category_id: category.id,
    name: 'Kitchen',
  });
  const habit = await insertAndReturn(owner.client, 'habits', {
    category_id: category.id,
    section_id: section.id,
    name: 'Water the plants',
    start_date: '2026-10-01',
  });
  const rule = await insertAndReturn(owner.client, 'habit_rules', {
    habit_id: habit.id,
    valid_from: '2026-10-01',
    frequency: 'daily',
  });
  const mark = await insertAndReturn(owner.client, 'habit_marks', {
    habit_id: habit.id,
    occurrence_date: '2026-10-02',
    status: 'done',
  });
  const task = await insertAndReturn(owner.client, 'tasks', {
    category_id: category.id,
    name: 'Pay the rent',
  });

  Object.assign(ownerRows, {
    categories: category,
    sections: section,
    habits: habit,
    habit_rules: rule,
    habit_marks: mark,
    tasks: task,
  });
}

function keyOf(table: TableName): Row {
  const row = ownerRows[table];
  const entries = TABLES[table].keyColumns.map((column) => [
    column,
    row[column],
  ]);
  return Object.fromEntries(entries);
}

async function readOwnerRow(table: TableName): Promise<Row | null> {
  const response = await owner.client
    .from(table)
    .select()
    .match(keyOf(table))
    .maybeSingle();
  expect(response.error).toBeNull();
  return response.data;
}

beforeAll(async () => {
  adminClient = createAdminClient();
  owner = await createTestUser(adminClient);
  intruder = await createTestUser(adminClient);
  await createOwnerRows();
});

afterAll(async () => {
  await deleteTestUser(adminClient, owner);
  await deleteTestUser(adminClient, intruder);
});

describe.each(TABLE_NAMES)('RLS on %s', (table) => {
  it('lets the owner read their own row', async () => {
    const row = await readOwnerRow(table);

    expect(row).not.toBeNull();
    expect(row?.user_id).toBe(owner.id);
  });

  it('hides the owner rows from another user', async () => {
    const response = await intruder.client.from(table).select();

    expect(response.error).toBeNull();
    expect(response.data).toEqual([]);
  });

  it('rejects an insert that claims the owner as user_id', async () => {
    const stolenPayload = { ...ownerRows[table], user_id: owner.id };

    const response = await intruder.client.from(table).insert(stolenPayload);

    expect(response.error?.code).toBe('42501');
  });

  it('does not let another user update the owner row', async () => {
    const change = TABLES[table].change;

    const response = await intruder.client
      .from(table)
      .update(change)
      .match(keyOf(table))
      .select();

    expect(response.error).toBeNull();
    expect(response.data).toEqual([]);
    expect(await readOwnerRow(table)).toEqual(ownerRows[table]);
  });

  it('does not let another user move a row to themselves', async () => {
    const response = await intruder.client
      .from(table)
      .update({ user_id: intruder.id })
      .match(keyOf(table))
      .select();

    expect(response.error).toBeNull();
    expect(response.data).toEqual([]);
    expect(await readOwnerRow(table)).toEqual(ownerRows[table]);
  });

  it('does not let another user delete the owner row', async () => {
    const response = await intruder.client
      .from(table)
      .delete()
      .match(keyOf(table))
      .select();

    expect(response.error).toBeNull();
    expect(response.data).toEqual([]);
    expect(await readOwnerRow(table)).toEqual(ownerRows[table]);
  });

  it('gives no access at all without a session', async () => {
    const anonymousClient = createAnonymousClient();

    const readResponse = await anonymousClient.from(table).select();
    const insertResponse = await anonymousClient
      .from(table)
      .insert(ownerRows[table]);

    expect(readResponse.error?.code).toBe('42501');
    expect(insertResponse.error?.code).toBe('42501');
  });
});

describe('Links between tables', () => {
  it('rejects a habit in a category that belongs to another user', async () => {
    const response = await intruder.client.from('habits').insert({
      category_id: ownerRows.categories.id,
      name: 'Sneaky habit',
      start_date: '2026-10-01',
    });

    expect(response.error?.code).toBe('23503');
  });

  it('rejects a task in a section that belongs to another user', async () => {
    const intruderCategory = await insertAndReturn(
      intruder.client,
      'categories',
      { name: 'Mine' },
    );

    const response = await intruder.client.from('tasks').insert({
      category_id: intruderCategory.id,
      section_id: ownerRows.sections.id,
      name: 'Sneaky task',
    });

    expect(response.error?.code).toBe('23503');
  });

  it('rejects a mark on a habit that belongs to another user', async () => {
    const response = await intruder.client.from('habit_marks').insert({
      habit_id: ownerRows.habits.id,
      occurrence_date: '2026-10-03',
      status: 'done',
    });

    expect(response.error?.code).toBe('23503');
  });
});

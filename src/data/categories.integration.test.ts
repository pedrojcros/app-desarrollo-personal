import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

import {
  countCategoryContents,
  createCategory,
  deleteCategory,
  fetchCategories,
  renameCategory,
  type Category,
} from './categories';
import { countSectionContents, createSection, deleteSection } from './sections';
import {
  createAdminClient,
  createTestUser,
  deleteTestUser,
  waitForLocalSchema,
  type TestUser,
} from './supabase/local-supabase';
import { supabase } from './supabase/client';

// Solo sustituye el almacenamiento nativo; las consultas usan Supabase local real.
jest.mock('./supabase/client', () => {
  const { createClient } = jest.requireActual<
    typeof import('@supabase/supabase-js')
  >('@supabase/supabase-js');
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Local Supabase environment variables are required');
  }
  return {
    supabase: createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  };
});

let adminClient: SupabaseClient;
let user: TestUser;

async function createCategoryOrThrow(name: string): Promise<Category> {
  const result = await createCategory({ name, icon: 'star', color: 'teal' });
  if (!result.ok) {
    throw new Error(`Could not create ${name}: ${result.error.message}`);
  }
  return result.value;
}

async function insertTasks(
  count: number,
  place: { categoryId: string; sectionId?: string },
): Promise<string[]> {
  const rows = Array.from({ length: count }, (_, index) => ({
    name: `Task ${index}`,
    category_id: place.categoryId,
    section_id: place.sectionId ?? null,
  }));
  const response = await user.client.from('tasks').insert(rows).select('id');
  if (response.error) {
    throw response.error;
  }
  return response.data.map((row) => row.id);
}

async function readTaskPlaces(taskIds: string[]) {
  const response = await user.client
    .from('tasks')
    .select('id, category_id, section_id')
    .in('id', taskIds);
  if (response.error) {
    throw response.error;
  }
  return response.data;
}

beforeAll(async () => {
  await waitForLocalSchema();
  adminClient = createAdminClient();
  user = await createTestUser(adminClient);
  const session = await user.client.auth.getSession();
  if (!session.data.session) {
    throw new Error('Test user must have a session');
  }
  const authentication = await supabase.auth.setSession(session.data.session);
  expect(authentication.error).toBeNull();
}, 35000);

afterAll(async () => {
  await deleteTestUser(adminClient, user);
});

describe('CU-07 scenario 1: create', () => {
  it('creates the category and lists it with its icon, color and no sections', async () => {
    const created = await createCategory({
      name: '  Compra  ',
      icon: 'shopping-cart',
      color: 'amber',
    });

    expect(created.ok).toBe(true);
    const categories = await fetchCategories();
    expect(categories.ok).toBe(true);
    if (!categories.ok) {
      return;
    }
    const purchase = categories.value.find(
      (category) => category.name === 'Compra',
    );
    expect(purchase).toMatchObject({
      icon: 'shopping-cart',
      color: 'amber',
      sections: [],
    });
  });
});

describe('CU-07 scenario 2: repeated name', () => {
  it('rejects the same name with other capitalization', async () => {
    await createCategoryOrThrow('Universidad');

    const repeated = await createCategory({
      name: 'universidad',
      icon: 'star',
      color: 'teal',
    });

    expect(repeated).toEqual({
      ok: false,
      error: { code: 'duplicate_name', message: expect.any(String) },
    });
  });

  it('allows the same name for another user', async () => {
    const otherUser = await createTestUser(adminClient);
    const otherInsertion = await otherUser.client
      .from('categories')
      .insert({ name: 'Compartida' });
    expect(otherInsertion.error).toBeNull();

    const result = await createCategory({
      name: 'Compartida',
      icon: 'star',
      color: 'teal',
    });

    expect(result.ok).toBe(true);
    await deleteTestUser(adminClient, otherUser);
  });
});

describe('CU-07 scenario 4: rename a category', () => {
  it('renames the category and keeps its tasks assigned', async () => {
    const nameSuffix = randomUUID();
    const purchaseName = `Compra ${nameSuffix}`;
    const supermarketName = `Supermercado ${nameSuffix}`;
    const purchase = await createCategoryOrThrow(purchaseName);
    const taskIds = await insertTasks(2, { categoryId: purchase.id });

    const renamed = await renameCategory(purchase.id, supermarketName);

    expect(renamed).toEqual({ ok: true, value: null });
    const categories = await fetchCategories();
    expect(
      categories.ok &&
        categories.value.find((category) => category.id === purchase.id)?.name,
    ).toBe(supermarketName);
    const places = await readTaskPlaces(taskIds);
    expect(places).toHaveLength(2);
    for (const place of places) {
      expect(place.category_id).toBe(purchase.id);
    }
  });

  it('rejects a name that duplicates another category with different capitalization', async () => {
    const nameSuffix = randomUUID();
    const purchaseName = `Compra ${nameSuffix}`;
    const supermarketName = `Supermercado ${nameSuffix}`;
    const purchase = await createCategoryOrThrow(purchaseName);
    await createCategoryOrThrow(supermarketName);

    const renamed = await renameCategory(
      purchase.id,
      supermarketName.toLowerCase(),
    );

    expect(renamed).toMatchObject({
      ok: false,
      error: { code: 'duplicate_name' },
    });
    const categories = await fetchCategories();
    expect(
      categories.ok &&
        categories.value.find((category) => category.id === purchase.id)?.name,
    ).toBe(purchaseName);
  });

  it('rejects an empty name and preserves the current category name', async () => {
    const nameSuffix = randomUUID();
    const purchaseName = `Compra ${nameSuffix}`;
    const purchase = await createCategoryOrThrow(purchaseName);

    const renamed = await renameCategory(purchase.id, '  ');
    const categories = await fetchCategories();

    expect(renamed).toMatchObject({
      ok: false,
      error: { code: 'invalid_input' },
    });
    expect(
      categories.ok &&
        categories.value.find((category) => category.id === purchase.id)?.name,
    ).toBe(purchaseName);
  });

  it('reports not_found when the category does not exist', async () => {
    const renamed = await renameCategory(randomUUID(), 'Supermercado');

    expect(renamed).toMatchObject({
      ok: false,
      error: { code: 'not_found' },
    });
  });
});

describe('validation', () => {
  it.each([
    ['empty name', { name: '', icon: 'star', color: 'teal' }],
    ['blank name', { name: '   ', icon: 'star', color: 'teal' }],
    ['too long name', { name: 'a'.repeat(61), icon: 'star', color: 'teal' }],
    ['unknown icon', { name: 'Valid', icon: 'rocket', color: 'teal' }],
    ['unknown color', { name: 'Valid', icon: 'star', color: 'purple' }],
  ])('rejects %s without touching the database', async (_label, input) => {
    const before = await fetchCategories();

    const result = await createCategory(input as never);

    expect(result).toEqual({
      ok: false,
      error: { code: 'invalid_input', message: expect.any(String) },
    });
    expect(await fetchCategories()).toEqual(before);
  });

  it('rejects an empty section name and an unknown category', async () => {
    const category = await createCategoryOrThrow('Con secciones vacías');

    const emptyName = await createSection({
      categoryId: category.id,
      name: ' ',
    });
    const unknownCategory = await createSection({
      categoryId: randomUUID(),
      name: 'Huérfana',
    });

    expect(emptyName).toMatchObject({
      ok: false,
      error: { code: 'invalid_input' },
    });
    expect(unknownCategory).toMatchObject({
      ok: false,
      error: { code: 'not_found' },
    });
  });
});

describe('reading', () => {
  it('sorts categories and sections by name ignoring capitalization', async () => {
    const zebra = await createCategoryOrThrow('zebra orden');
    const alpha = await createCategoryOrThrow('Álamo orden');
    await createSection({ categoryId: zebra.id, name: 'beta' });
    await createSection({ categoryId: zebra.id, name: 'Alfa' });

    const result = await fetchCategories();

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const names = result.value
      .filter((category) => category.name.endsWith('orden'))
      .map((category) => category.name);
    expect(names).toEqual(['Álamo orden', 'zebra orden']);
    const sortedZebra = result.value.find(
      (category) => category.id === zebra.id,
    );
    expect(sortedZebra?.sections.map((section) => section.name)).toEqual([
      'Alfa',
      'beta',
    ]);
    expect(alpha.sections).toEqual([]);
  });

  it('turns an unknown icon or color stored in the database into star and teal', async () => {
    const insertion = await user.client
      .from('categories')
      .insert({ name: 'Rara', icon: 'rocket', color: 'purple' });
    expect(insertion.error).toBeNull();
    const nullInsertion = await user.client
      .from('categories')
      .insert({ name: 'Sin estilo' });
    expect(nullInsertion.error).toBeNull();

    const result = await fetchCategories();

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const strange = result.value.filter((category) =>
      ['Rara', 'Sin estilo'].includes(category.name),
    );
    expect(strange).toHaveLength(2);
    for (const category of strange) {
      expect(category).toMatchObject({ icon: 'star', color: 'teal' });
    }
  });
});

describe('CU-07 scenario 3: delete a category with content', () => {
  it('keeps the tasks and habits, now in the Inbox', async () => {
    const purchase = await createCategoryOrThrow('Compra eliminar');
    const taskIds = await insertTasks(3, { categoryId: purchase.id });
    const habitInsertion = await user.client.from('habits').insert([
      {
        name: 'Hábito activo',
        start_date: '2026-10-01',
        category_id: purchase.id,
      },
      {
        name: 'Hábito archivado',
        start_date: '2026-10-01',
        category_id: purchase.id,
        archived_at: '2026-10-02T10:00:00Z',
      },
    ]);
    expect(habitInsertion.error).toBeNull();

    const counts = await countCategoryContents(purchase.id);
    const deletion = await deleteCategory(purchase.id);

    expect(counts).toEqual({ ok: true, value: { habits: 1, tasks: 3 } });
    expect(deletion).toEqual({ ok: true, value: null });
    const places = await readTaskPlaces(taskIds);
    expect(places).toHaveLength(3);
    for (const place of places) {
      expect(place).toMatchObject({ category_id: null, section_id: null });
    }
    const habits = await user.client
      .from('habits')
      .select('name, category_id')
      .in('name', ['Hábito activo', 'Hábito archivado']);
    expect(habits.data).toHaveLength(2);
    for (const habit of habits.data ?? []) {
      expect(habit.category_id).toBeNull();
    }
    const remaining = await fetchCategories();
    expect(
      remaining.ok && remaining.value.map((item) => item.id),
    ).not.toContain(purchase.id);
  });

  it('reports not_found for a category that does not exist', async () => {
    const result = await deleteCategory(randomUUID());

    expect(result).toMatchObject({ ok: false, error: { code: 'not_found' } });
  });
});

describe('CU-07 scenarios 6 and 7: sections', () => {
  it('creates sections, shows them under the category and rejects repeated names', async () => {
    const shopping = await createCategoryOrThrow('Lista de la compra');
    const other = await createCategoryOrThrow('Otra lista');

    const mercadona = await createSection({
      categoryId: shopping.id,
      name: 'Mercadona',
    });
    const lidl = await createSection({ categoryId: shopping.id, name: 'Lidl' });
    const repeated = await createSection({
      categoryId: shopping.id,
      name: 'mercadona',
    });
    const sameNameElsewhere = await createSection({
      categoryId: other.id,
      name: 'Mercadona',
    });

    expect(mercadona.ok && lidl.ok && sameNameElsewhere.ok).toBe(true);
    expect(repeated).toMatchObject({
      ok: false,
      error: { code: 'duplicate_name' },
    });
    if (!mercadona.ok) {
      return;
    }
    const taskIds = await insertTasks(1, {
      categoryId: shopping.id,
      sectionId: mercadona.value.id,
    });
    const categories = await fetchCategories();
    const found = categories.ok
      ? categories.value.find((category) => category.id === shopping.id)
      : undefined;
    expect(found?.sections.map((section) => section.name)).toEqual([
      'Lidl',
      'Mercadona',
    ]);
    const places = await readTaskPlaces(taskIds);
    expect(places[0].section_id).toBe(mercadona.value.id);
  });

  it('keeps the content in the category, without section, when a section is deleted', async () => {
    const shopping = await createCategoryOrThrow('Compra con sección');
    const section = await createSection({
      categoryId: shopping.id,
      name: 'Mercadona',
    });
    if (!section.ok) {
      throw new Error('Could not create the section');
    }
    const taskIds = await insertTasks(2, {
      categoryId: shopping.id,
      sectionId: section.value.id,
    });

    const counts = await countSectionContents(section.value.id);
    const deletion = await deleteSection(section.value.id);

    expect(counts).toEqual({ ok: true, value: { habits: 0, tasks: 2 } });
    expect(deletion).toEqual({ ok: true, value: null });
    const places = await readTaskPlaces(taskIds);
    for (const place of places) {
      expect(place).toMatchObject({
        category_id: shopping.id,
        section_id: null,
      });
    }
  });

  it('reports not_found for a section that does not exist', async () => {
    const result = await deleteSection(randomUUID());

    expect(result).toMatchObject({ ok: false, error: { code: 'not_found' } });
  });
});

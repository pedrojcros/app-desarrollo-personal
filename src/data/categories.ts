import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { z } from 'zod';

import {
  CATEGORY_ICON_NAMES,
  DEFAULT_CATEGORY_ICON_NAME,
  isCategoryIconName,
  type CategoryIconName,
} from '../components/category-icon/category-icon-names';
import { CATEGORY_COLORS, type CategoryColor } from '../theme/category-colors';

import {
  countContents,
  describeInvalidInput,
  describePostgrestFailure,
  describeThrownFailure,
  nameSchema,
  type ContentCounts,
} from './category-shared';
import { queryKeys } from './query-keys';
import {
  succeed,
  unwrapResult,
  type DataResult,
  type DataResultError,
} from './result';
import type { Section } from './sections';
import { supabase } from './supabase/client';

export interface Category {
  id: string;
  name: string;
  icon: CategoryIconName;
  color: CategoryColor;
  sections: Section[];
}

export type CreateCategoryInput = {
  name: string;
  icon: CategoryIconName;
  color: CategoryColor;
};

const DEFAULT_CATEGORY_COLOR: CategoryColor = 'teal';

const createCategorySchema = z.object({
  name: nameSchema,
  icon: z.enum(CATEGORY_ICON_NAMES),
  color: z.enum(CATEGORY_COLORS),
});

type SectionRow = { id: string; category_id: string; name: string };
type CategoryRow = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  sections: SectionRow[];
};

function isCategoryColor(value: unknown): value is CategoryColor {
  return CATEGORY_COLORS.some((color) => color === value);
}

// Un valor desconocido en la base de datos no debe romper la lista entera.
function readIcon(value: string | null): CategoryIconName {
  if (isCategoryIconName(value)) {
    return value;
  }
  return DEFAULT_CATEGORY_ICON_NAME;
}

function readColor(value: string | null): CategoryColor {
  if (isCategoryColor(value)) {
    return value;
  }
  return DEFAULT_CATEGORY_COLOR;
}

function compareNames(first: { name: string }, second: { name: string }) {
  // «accent» ignora las mayúsculas pero no las tildes.
  return first.name.localeCompare(second.name, 'es', { sensitivity: 'accent' });
}

function mapSectionRow(row: SectionRow): Section {
  return { id: row.id, categoryId: row.category_id, name: row.name };
}

function mapCategoryRow(row: CategoryRow): Category {
  const sections = row.sections.map(mapSectionRow).sort(compareNames);
  return {
    id: row.id,
    name: row.name,
    icon: readIcon(row.icon),
    color: readColor(row.color),
    sections,
  };
}

/** Categorías con sus secciones, ordenadas por nombre; RLS limita las filas al dueño. */
export async function fetchCategories(): Promise<DataResult<Category[]>> {
  try {
    const response = await supabase
      .from('categories')
      .select('id, name, icon, color, sections(id, category_id, name)');
    if (response.error) {
      return describePostgrestFailure(response.error, response.status);
    }
    const categories = response.data.map(mapCategoryRow).sort(compareNames);
    return succeed(categories);
  } catch (error) {
    return describeThrownFailure(error);
  }
}

export async function createCategory(
  input: CreateCategoryInput,
): Promise<DataResult<Category>> {
  const parsedInput = createCategorySchema.safeParse(input);
  if (!parsedInput.success) {
    return describeInvalidInput(parsedInput.error);
  }
  try {
    const response = await supabase
      .from('categories')
      .insert(parsedInput.data)
      .select('id, name, icon, color')
      .single();
    if (response.error) {
      return describePostgrestFailure(response.error, response.status);
    }
    const createdCategory = mapCategoryRow({ ...response.data, sections: [] });
    return succeed(createdCategory);
  } catch (error) {
    return describeThrownFailure(error);
  }
}

export function countCategoryContents(
  categoryId: string,
): Promise<DataResult<ContentCounts>> {
  return countContents('category_id', categoryId);
}

/** Lo que contiene pasa a la Bandeja: lo hace la función delete_category, en una transacción. */
export async function deleteCategory(
  categoryId: string,
): Promise<DataResult<null>> {
  const parsedId = z.uuid().safeParse(categoryId);
  if (!parsedId.success) {
    return describeInvalidInput(parsedId.error);
  }
  try {
    const response = await supabase.rpc('delete_category', {
      target_category_id: parsedId.data,
    });
    if (response.error) {
      return describePostgrestFailure(response.error, response.status);
    }
    return succeed(null);
  } catch (error) {
    return describeThrownFailure(error);
  }
}

export function useCategories(): UseQueryResult<Category[], DataResultError> {
  return useQuery({
    queryKey: queryKeys.categories(),
    queryFn: async () => unwrapResult(await fetchCategories()),
  });
}

export function useCreateCategory(): UseMutationResult<
  Category,
  DataResultError,
  CreateCategoryInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCategoryInput) =>
      unwrapResult(await createCategory(input)),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.categories() }),
  });
}

export function useDeleteCategory(): UseMutationResult<
  null,
  DataResultError,
  string
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (categoryId: string) =>
      unwrapResult(await deleteCategory(categoryId)),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.categories() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.views() }),
      ]),
  });
}

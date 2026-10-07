import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { z } from 'zod';

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
  fail,
  succeed,
  unwrapResult,
  type DataResult,
  type DataResultError,
} from './result';
import { supabase } from './supabase/client';

export interface Section {
  id: string;
  categoryId: string;
  name: string;
}

const createSectionSchema = z.object({
  categoryId: z.uuid(),
  name: nameSchema,
});

export type CreateSectionInput = { categoryId: string; name: string };

export async function createSection(
  input: CreateSectionInput,
): Promise<DataResult<Section>> {
  const parsedInput = createSectionSchema.safeParse(input);
  if (!parsedInput.success) {
    return describeInvalidInput(parsedInput.error);
  }
  const { categoryId, name } = parsedInput.data;
  try {
    const response = await supabase
      .from('sections')
      .insert({ category_id: categoryId, name })
      .select('id, category_id, name')
      .single();
    if (response.error) {
      return describePostgrestFailure(response.error, response.status);
    }
    const row = response.data;
    return succeed({ id: row.id, categoryId: row.category_id, name: row.name });
  } catch (error) {
    return describeThrownFailure(error);
  }
}

export function countSectionContents(
  sectionId: string,
): Promise<DataResult<ContentCounts>> {
  return countContents('section_id', sectionId);
}

/** Lo que contiene la sección se queda en su categoría, sin sección (lo hace la base de datos). */
export async function deleteSection(
  sectionId: string,
): Promise<DataResult<null>> {
  const parsedId = z.uuid().safeParse(sectionId);
  if (!parsedId.success) {
    return describeInvalidInput(parsedId.error);
  }
  try {
    const response = await supabase
      .from('sections')
      .delete()
      .eq('id', parsedId.data)
      .select('id');
    if (response.error) {
      return describePostgrestFailure(response.error, response.status);
    }
    if (response.data.length === 0) {
      return fail('not_found', 'The section does not exist');
    }
    return succeed(null);
  } catch (error) {
    return describeThrownFailure(error);
  }
}

export function useCreateSection(): UseMutationResult<
  Section,
  DataResultError,
  CreateSectionInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSectionInput) =>
      unwrapResult(await createSection(input)),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.categories() }),
  });
}

export function useDeleteSection(): UseMutationResult<
  null,
  DataResultError,
  string
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sectionId: string) =>
      unwrapResult(await deleteSection(sectionId)),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.categories() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.views() }),
      ]),
  });
}

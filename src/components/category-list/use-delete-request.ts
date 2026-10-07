import { useState } from 'react';

import {
  countCategoryContents,
  useDeleteCategory,
  type Category,
} from '@/data/categories';
import { useDeleteSection, type Section } from '@/data/sections';
import {
  describeCategoryDeletion,
  describeDeleteError,
  describeSectionDeletion,
} from '@/domain/category-messages';

export type DeleteRequest = {
  title: string;
  message: string;
  confirm: () => void;
};

const COUNT_FAILED_MESSAGE =
  'No se ha podido comprobar qué contiene. Inténtalo de nuevo.';

// Eliminar pide antes la cuenta de lo que contiene, para avisar con datos
// reales, y después deja la confirmación pendiente hasta que el usuario decida.
export function useDeleteRequest() {
  const [request, setRequest] = useState<DeleteRequest | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteCategory = useDeleteCategory();
  const deleteSection = useDeleteSection();

  function cancel(): void {
    setRequest(null);
  }

  function finishWith(error: { code: string } | null): void {
    setRequest(null);
    if (error) {
      setErrorMessage(describeDeleteError(error.code));
    }
  }

  async function requestCategoryDeletion(category: Category): Promise<void> {
    setErrorMessage(null);
    const counts = await countCategoryContents(category.id);
    if (!counts.ok) {
      setErrorMessage(COUNT_FAILED_MESSAGE);
      return;
    }
    setRequest({
      title: `Eliminar «${category.name}»`,
      message: describeCategoryDeletion(counts.value),
      confirm: () =>
        deleteCategory.mutate(category.id, {
          onSuccess: () => finishWith(null),
          onError: finishWith,
        }),
    });
  }

  // El aviso de una sección no necesita contar: lo que contiene se queda en su categoría.
  function requestSectionDeletion(category: Category, section: Section): void {
    setErrorMessage(null);
    setRequest({
      title: `Eliminar «${section.name}»`,
      message: describeSectionDeletion(category.name),
      confirm: () =>
        deleteSection.mutate(section.id, {
          onSuccess: () => finishWith(null),
          onError: finishWith,
        }),
    });
  }

  return {
    request,
    errorMessage,
    requestCategoryDeletion,
    requestSectionDeletion,
    cancel,
  };
}

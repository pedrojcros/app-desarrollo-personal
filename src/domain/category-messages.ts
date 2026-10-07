// Textos que ve el usuario al gestionar categorías y secciones. Son funciones
// puras para poder probarlos sin pantalla.

export type ContentCounts = { habits: number; tasks: number };

function pluralize(count: number, singular: string, plural: string): string {
  if (count === 1) {
    return `${count} ${singular}`;
  }
  return `${count} ${plural}`;
}

/** Aviso antes de eliminar una categoría: sus hábitos y tareas pasan a la Bandeja (RN-26). */
export function describeCategoryDeletion(counts: ContentCounts): string {
  const habits = pluralize(counts.habits, 'hábito', 'hábitos');
  const tasks = pluralize(counts.tasks, 'tarea', 'tareas');
  return `Se moverán a la Bandeja ${habits} y ${tasks}.`;
}

/** Aviso antes de eliminar una sección: lo que contiene sigue en su categoría. */
export function describeSectionDeletion(categoryName: string): string {
  return `Lo que contiene seguirá en "${categoryName}", sin sección.`;
}

/** Cada código de error de src/data, dicho en español y sin jerga. */
export function describeSaveError(
  code: string,
  subject: 'categoría' | 'sección',
): string {
  if (code === 'invalid_input') {
    return 'El nombre es obligatorio y puede tener hasta 60 caracteres.';
  }
  if (code === 'duplicate_name') {
    return `Ya existe una ${subject} con ese nombre.`;
  }
  if (code === 'network_error') {
    return 'No hay conexión. Inténtalo de nuevo.';
  }
  return `No se ha podido guardar la ${subject}. Inténtalo de nuevo.`;
}

export function describeDeleteError(code: string): string {
  if (code === 'network_error') {
    return 'No hay conexión. Inténtalo de nuevo.';
  }
  if (code === 'not_found') {
    return 'Ya no existe. Se ha actualizado la lista.';
  }
  return 'No se ha podido eliminar. Inténtalo de nuevo.';
}

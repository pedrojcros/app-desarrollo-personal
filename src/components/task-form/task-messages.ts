// Textos que ve el usuario al guardar una tarea. Funciones puras para poder
// probarlas sin pantalla.

/** Cada código de error de src/data, dicho en español y sin jerga. */
export function describeTaskSaveError(code: string): string {
  if (code === 'invalid_input') {
    return 'Revisa los datos de la tarea: el nombre es obligatorio y puede tener hasta 120 caracteres.';
  }
  if (code === 'not_found') {
    return 'La tarea o su categoría ya no existen.';
  }
  if (code === 'network_error') {
    return 'No hay conexión. Inténtalo de nuevo.';
  }
  return 'No se ha podido guardar la tarea. Inténtalo de nuevo.';
}

export function describeTaskArchiveError(code: string): string {
  if (code === 'network_error') {
    return 'No hay conexión. Inténtalo de nuevo.';
  }
  return 'No se ha podido archivar la tarea. Inténtalo de nuevo.';
}

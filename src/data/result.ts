// Forma común de lo que devuelven las funciones de src/data (AGENTS.md):
// nunca lanzan errores esperables, los devuelven. Código y mensaje en inglés.
export type DataError = {
  code: string;
  message: string;
};

export type DataResult<Value> =
  { ok: true; value: Value } | { ok: false; error: DataError };

export function succeed<Value>(value: Value): DataResult<Value> {
  return { ok: true, value };
}

export function fail(code: string, message: string): DataResult<never> {
  return { ok: false, error: { code, message } };
}

/** Error de queryFn y mutationFn cuando una operación devuelve un DataResult fallido. */
export class DataResultError extends Error {
  readonly code: string;

  constructor(error: DataError) {
    super(error.message);
    this.name = 'DataResultError';
    this.code = error.code;
  }
}

/** Solo para queryFn y mutationFn: devuelve el valor o lanza un error tipado. */
export function unwrapResult<Value>(result: DataResult<Value>): Value {
  if (!result.ok) {
    throw new DataResultError(result.error);
  }
  return result.value;
}

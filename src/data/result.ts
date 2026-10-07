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

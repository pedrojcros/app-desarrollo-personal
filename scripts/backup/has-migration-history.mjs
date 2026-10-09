// La primera copia de producción precede a la primera migración: el esquema
// de historial todavía no existe. Consultarlo evita ocultar errores de pg_dump.
const project = process.env.SUPABASE_PROJECT_REF;
const response = await fetch(
  `https://api.supabase.com/v1/projects/${project}/database/query`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query:
        "SELECT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'supabase_migrations') AS exists",
      read_only: true,
    }),
  },
);
if (!response.ok) {
  throw new Error(
    `Migration history inspection failed: HTTP ${response.status}`,
  );
}
const records = await response.json();
if (typeof records[0]?.exists !== 'boolean') {
  throw new Error('Migration history inspection returned an invalid result');
}
console.log(records[0].exists ? 'present' : 'absent');

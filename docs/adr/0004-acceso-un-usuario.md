# ADR-0004: Acceso de un solo usuario

- **Estado:** Propuesta (DEC-21)
- **Fecha:** 2026-10-06
- **Decisores:** el humano, a propuesta del arquitecto

## Contexto

La aplicación está en internet desde la versión 1 (DEC-19) y solo la usa su dueño. Coste cero. En la versión 2 hará falta que el usuario conecte su cuenta de Google para Calendar.

## Opciones consideradas

- **A:** Supabase Auth con **email y contraseña**, con el registro de usuarios nuevos desactivado.
- **B:** Supabase Auth con **inicio de sesión de Google** desde la versión 1.

## Decisión

**A** en la versión 1; Google se añade en la versión 2, junto con Calendar. Además, **toda tabla lleva `user_id` y políticas RLS** (cada fila solo la ve y la cambia su dueño), aunque haya un único usuario.

## Consecuencias

- **Más fácil:** no hay que configurar Google Cloud en la versión 1; RLS protege los datos aunque falle el código de la aplicación; pasar a varios usuarios en el futuro no obliga a rehacer el modelo de datos.
- **Más difícil:** una contraseña más; en la versión 2 habrá que enlazar Google a la misma cuenta.
- **Revisar:** al empezar la versión 2.

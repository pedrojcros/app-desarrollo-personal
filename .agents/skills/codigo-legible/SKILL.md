---
name: codigo-legible
description: Cómo escribir código en este proyecto para que lo pueda leer y mantener una persona — nombres en inglés sin abreviaturas, una línea una cosa, salir pronto, funciones cortas, comentarios en español que explican el porqué. Usar siempre que se escriba, corrija o revise código TypeScript del proyecto.
---

# Código legible

Es la regla obligatoria de «Legibilidad» de `AGENTS.md`, con ejemplos. Un cambio que no la cumple **no se fusiona**, aunque funcione y pase los tests. Vale para todo: aplicación, tests, SQL y scripts.

## 1. Idioma

- **Nombres** (variables, funciones, tipos, ficheros) y **mensajes de error técnicos**: en inglés.
- **Comentarios y commits**: en español.
- **Textos que ve el usuario**: en español.
- Los nombres del dominio salen del glosario de `docs/04-arquitectura.md`: `habit`, `occurrence`, `mark`, `task`, `category`, `inbox`, `timeSlot`, `overdue`…

## 2. Nada de abreviaturas ni variables de una letra

```ts
// Mal
const o = getOcc(h, d);
items.map((i) => i.id);

// Bien
const occurrences = getOccurrencesForDay(habit, day);
items.map((item) => item.id);
```

Solo se admiten las siglas que son el nombre de algo (`id`, `url`, `api`).

## 3. Una línea, una cosa

Si una línea calcula, filtra y transforma a la vez, se parte. Los resultados intermedios llevan nombre.

```ts
// Mal
const nextIds = tasks.filter((task) => task.status === "pending").sort(byDueDate).slice(0, 5).map((task) => task.id);

// Bien
const pendingTasks = tasks.filter((task) => task.status === "pending");
const pendingTasksByDueDate = pendingTasks.sort(byDueDate);
const nextPendingTasks = pendingTasksByDueDate.slice(0, 5);
const nextIds = nextPendingTasks.map((task) => task.id);
```

## 4. Cadenas de llamadas cortas

Una llamada por línea. Si la cadena pasa de tres o cuatro pasos, córtala con una variable que diga qué hay en ese punto (como en el ejemplo anterior).

## 5. Nada de trucos compactos

```ts
// Mal
isOverdue && moveToPastPending(task);
const label = isDone ? "Hecha" : isSkipped ? "No hecha" : "Pendiente";

// Bien
if (isOverdue) {
  moveToPastPending(task);
}
const label = getStatusLabel(task.status);
```

Prohibidos: ternarios anidados, asignaciones dentro de condiciones y efectos secundarios escondidos en una expresión.

## 6. Salir pronto antes que anidar

```ts
// Mal
function markAsDone(task: Task | undefined) {
  if (task) {
    if (task.status === "pending") {
      // ... lógica principal tres niveles dentro
    }
  }
}

// Bien
function markAsDone(task: Task | undefined) {
  if (!task) {
    return;
  }
  if (task.status !== "pending") {
    return;
  }
  // ... lógica principal
}
```

## 7. Funciones cortas, con el nombre de lo que hacen

Si un bloque necesita un comentario para explicar **qué** hace, casi siempre es una función con ese nombre. Los comentarios explican el **porqué**:

```ts
// Las ocurrencias se calculan desde la versión de la regla vigente ese día,
// para que cambiar la frecuencia no reescriba el pasado (ADR-0003).
const activeRule = findRuleValidOn(habit.rules, day);
```

## Al terminar

Relee tu diff como lo leería una persona que no conoce el código: si algo se entiende solo después de pensarlo dos veces, simplifícalo (skill `code-simplification`).

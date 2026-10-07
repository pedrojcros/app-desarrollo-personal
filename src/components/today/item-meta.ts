import type { ViewItem } from '@/domain/items';

/** «10:00 · Personal · Hábito»: lo que no existe se salta. */
export function describeItemMeta(
  item: ViewItem,
  categoryName: string | undefined,
): string {
  const kindLabel = item.target.kind === 'task' ? 'Tarea' : 'Hábito';
  const parts = [item.sortTime, categoryName, kindLabel];
  const presentParts = parts.filter(
    (part) => part !== null && part !== undefined,
  );
  return presentParts.join(' · ');
}

/** Ruta de la ficha del elemento (las construyen T05 y T06). */
export function getItemDetailPath(item: ViewItem): string {
  if (item.target.kind === 'task') {
    return `/tareas/${item.target.taskId}`;
  }
  return `/habitos/${item.target.habitId}`;
}

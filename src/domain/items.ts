import type { CalendarDate } from './types';

export type ItemStatus = 'pending' | 'done' | 'not_done';

/** Lo que se marca: una ocurrencia de un hábito en un día, o una tarea. */
export type MarkTarget =
  | { kind: 'occurrence'; habitId: string; date: CalendarDate }
  | { kind: 'task'; taskId: string };

/** Un elemento de cualquier vista. */
export interface ViewItem {
  target: MarkTarget;
  name: string;
  status: ItemStatus;
  /** Ocurrencia o vencimiento; null si la tarea no tiene fecha. */
  date: CalendarDate | null;
  /** HH:MM exacta o de la franja (RN-20); null si no tiene hora. */
  sortTime: string | null;
  categoryId: string | null;
  sectionId: string | null;
  /** Instante UTC ISO de la marca; null si está pendiente. */
  markedAt: string | null;
}

/** Datos de cada caché de vista bajo ['views', ...]. */
export interface ViewData {
  items: ViewItem[];
}

/** Clave estable para listas y comparaciones, separando tareas y ocurrencias. */
export function getMarkTargetKey(target: MarkTarget): string {
  if (target.kind === 'task') {
    return `task:${target.taskId}`;
  }
  return `occurrence:${target.habitId}:${target.date}`;
}

export function isSameMarkTarget(
  first: MarkTarget,
  second: MarkTarget,
): boolean {
  return getMarkTargetKey(first) === getMarkTargetKey(second);
}

/** Copia la lista y parchea todos los elementos del objetivo sin mutar los demás. */
export function applyStatusToItems(
  items: ViewItem[],
  target: MarkTarget,
  status: ItemStatus,
  markedAt: string | null,
): ViewItem[] {
  return items.map((item) => {
    if (!isSameMarkTarget(item.target, target)) {
      return item;
    }
    return { ...item, status, markedAt };
  });
}

/** Hora ascendente, sin hora al final; desempate por nombre español y clave. */
export function compareViewItemsForDay(
  first: ViewItem,
  second: ViewItem,
): number {
  if (first.sortTime === null && second.sortTime !== null) {
    return 1;
  }
  if (first.sortTime !== null && second.sortTime === null) {
    return -1;
  }
  if (
    first.sortTime !== null &&
    second.sortTime !== null &&
    first.sortTime !== second.sortTime
  ) {
    return first.sortTime < second.sortTime ? -1 : 1;
  }
  const nameComparison = first.name.localeCompare(second.name, 'es');
  if (nameComparison !== 0) {
    return nameComparison;
  }
  const firstKey = getMarkTargetKey(first.target);
  const secondKey = getMarkTargetKey(second.target);
  if (firstKey === secondKey) {
    return 0;
  }
  return firstKey < secondKey ? -1 : 1;
}

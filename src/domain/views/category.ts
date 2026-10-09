import type { Habit, HabitMark, Task } from '../entities';
import {
  getHabitOccurrences,
  indexMarks,
  occurrenceToViewItem,
  taskToViewItem,
} from '../habit-occurrences';
import { compareViewItemsForDay, type ViewItem } from '../items';
import type { CalendarDate } from '../types';

type CategoryViewInput = {
  habits: Habit[];
  marks: HabitMark[];
  tasks: Task[];
  categoryId: string | null;
  today: CalendarDate;
};
type SectionReference = { id: string; name: string };
type SectionGroup = { sectionId: string | null; items: ViewItem[] };

function compareCategoryItems(first: ViewItem, second: ViewItem): number {
  if (first.date === null && second.date !== null) {
    return 1;
  }
  if (first.date !== null && second.date === null) {
    return -1;
  }
  if (first.date !== null && second.date !== null) {
    if (first.date !== second.date) {
      return first.date < second.date ? -1 : 1;
    }
    return compareViewItemsForDay(first, second);
  }
  return first.name.localeCompare(second.name, 'es');
}

/** Todas las tareas pendientes, pero solo la ocurrencia pendiente de hoy. */
export function getCategoryViewItems({
  habits,
  marks,
  tasks,
  categoryId,
  today,
}: CategoryViewInput): ViewItem[] {
  const items: ViewItem[] = [];
  const markIndex = indexMarks(marks);
  for (const habit of habits) {
    if (habit.categoryId !== categoryId || habit.archivedOn !== null) {
      continue;
    }
    const occurrences = getHabitOccurrences(habit, today, today);
    for (const occurrence of occurrences) {
      const item = occurrenceToViewItem(habit, occurrence, markIndex);
      if (item.status === 'pending') {
        items.push(item);
      }
    }
  }
  for (const task of tasks) {
    if (task.categoryId !== categoryId || task.archivedOn !== null) {
      continue;
    }
    if (task.status !== 'pending') {
      continue;
    }
    items.push(taskToViewItem(task));
  }
  return items.sort(compareCategoryItems);
}

/** Agrupa sin alterar el orden de la vista; las secciones vacías no ocupan sitio. */
export function groupBySection(
  items: ViewItem[],
  sections: SectionReference[],
): SectionGroup[] {
  const sortedSections = [...sections];
  sortedSections.sort((first, second) =>
    first.name.localeCompare(second.name, 'es'),
  );
  const sectionItems = new Map<string, ViewItem[]>();
  for (const section of sortedSections) {
    sectionItems.set(section.id, []);
  }
  const unsectionedItems: ViewItem[] = [];
  for (const item of items) {
    const group =
      item.sectionId === null ? undefined : sectionItems.get(item.sectionId);
    // Una lectura de categorías más antigua no debe ocultar elementos de la vista.
    if (group === undefined) {
      unsectionedItems.push(item);
      continue;
    }
    group.push(item);
  }
  const groups: SectionGroup[] = [];
  for (const section of sortedSections) {
    const group = sectionItems.get(section.id)!;
    if (group.length > 0) {
      groups.push({ sectionId: section.id, items: group });
    }
  }
  if (unsectionedItems.length > 0) {
    groups.push({ sectionId: null, items: unsectionedItems });
  }
  return groups;
}

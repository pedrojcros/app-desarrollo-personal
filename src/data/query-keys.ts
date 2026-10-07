import type { CalendarDate } from '../domain/types';

// Toda clave bajo ['views', ...] guarda un ViewData: marcar parchea todas a la vez.
// Crear, modificar o archivar hábitos, tareas, categorías o secciones invalida
// ['views'] y también ['categories'] si toca categorías o secciones.
export const queryKeys = {
  categories: () => ['categories'] as const,
  views: () => ['views'] as const,
  today: (date: CalendarDate) => ['views', 'today', date] as const,
  categoryView: (categoryId: string | null) =>
    ['views', 'category', categoryId ?? 'inbox'] as const,
  pastPending: (today: CalendarDate) =>
    ['views', 'past-pending', today] as const,
  history: (fromDate: CalendarDate, toDate: CalendarDate) =>
    ['views', 'history', fromDate, toDate] as const,
};

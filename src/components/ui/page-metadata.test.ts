import { expect, it } from '@jest/globals';

import { getPageTitle } from './page-metadata';

it.each([
  ['/hoy', 'Hoy'],
  ['/bandeja', 'Bandeja'],
  ['/categorias', 'Categorías'],
  ['/pendientes', 'Pendientes'],
  ['/historial', 'Historial'],
  ['/ajustes', 'Ajustes'],
  ['/tareas/nueva', 'Nueva tarea'],
  ['/habitos/nuevo', 'Nuevo hábito'],
  ['/tareas/task-id', 'Tarea'],
  ['/habitos/habit-id', 'Hábito'],
  ['/categorias/category-id', 'Categoría'],
  ['/login', 'Entrar'],
])('gives %s a descriptive document title', (pathname, title) => {
  expect(getPageTitle(pathname)).toBe(`${title} · Desarrollo personal`);
});

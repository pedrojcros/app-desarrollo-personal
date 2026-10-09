import { describe, expect, it } from '@jest/globals';

import {
  describeCategoryDeletion,
  describeDeleteError,
  describeSaveError,
  describeSectionDeletion,
} from './category-messages';

describe('describeCategoryDeletion', () => {
  it('says how many habits and tasks move to the Inbox', () => {
    const message = describeCategoryDeletion({ habits: 2, tasks: 3 });

    expect(message).toBe('Se moverán a la Bandeja 2 hábitos y 3 tareas.');
  });

  it('uses the singular for one and the plural for zero', () => {
    const message = describeCategoryDeletion({ habits: 1, tasks: 0 });

    expect(message).toBe('Se moverán a la Bandeja 1 hábito y 0 tareas.');
  });
});

describe('describeSectionDeletion', () => {
  it('says the content stays in the category', () => {
    const message = describeSectionDeletion('Lista de la compra');

    expect(message).toBe(
      'Lo que contiene seguirá en "Lista de la compra", sin sección.',
    );
  });
});

describe('describeSaveError', () => {
  it.each([
    ['invalid_input', 'categoría', 'El nombre es obligatorio'],
    ['duplicate_name', 'categoría', 'Ya existe una categoría con ese nombre.'],
    ['duplicate_name', 'sección', 'Ya existe una sección con ese nombre.'],
    ['network_error', 'sección', 'No hay conexión'],
    ['unknown_error', 'sección', 'No se ha podido guardar la sección'],
  ])('explains %s for a %s', (code, subject, expectedStart) => {
    const message = describeSaveError(code, subject as 'categoría' | 'sección');

    expect(message.startsWith(expectedStart)).toBe(true);
  });
});

describe('describeDeleteError', () => {
  it('never shows a technical error', () => {
    const message = describeDeleteError('P0002 category_not_found raw');

    expect(message).toBe('No se ha podido eliminar. Inténtalo de nuevo.');
  });
});

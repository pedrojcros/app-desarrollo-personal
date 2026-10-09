import { compareCalendarDates } from '@/domain/calendar-date';
import type { CalendarDate } from '@/domain/types';
import type { TaskInput } from '@/data/tasks';

const MAXIMUM_NAME_LENGTH = 120;

/** Hora que se propone al pulsar «Añadir hora». */
export const DEFAULT_DUE_TIME = '09:00';

export interface TaskFormValues {
  name: string;
  notes: string;
  dueDate: CalendarDate | null;
  /** 'HH:MM', solo con `dueDate`. */
  dueTime: string | null;
  /** null = Bandeja de entrada. */
  categoryId: string | null;
  sectionId: string | null;
}

export interface TaskFormErrors {
  name?: string;
}

export const EMPTY_TASK_FORM_VALUES: TaskFormValues = {
  name: '',
  notes: '',
  dueDate: null,
  dueTime: null,
  categoryId: null,
  sectionId: null,
};

export function validateTaskForm(values: TaskFormValues): TaskFormErrors {
  const trimmedName = values.name.trim();
  if (trimmedName === '') {
    return { name: 'El nombre es obligatorio.' };
  }
  if (trimmedName.length > MAXIMUM_NAME_LENGTH) {
    return {
      name: `El nombre puede tener hasta ${MAXIMUM_NAME_LENGTH} caracteres.`,
    };
  }
  return {};
}

export function hasErrors(errors: TaskFormErrors): boolean {
  return errors.name !== undefined;
}

/** Sin fecha no hay hora: la hora de una fecha quitada se descarta. */
export function buildTaskInput(values: TaskFormValues): TaskInput {
  const dueTime = values.dueDate === null ? null : values.dueTime;
  return {
    name: values.name.trim(),
    notes: values.notes,
    dueDate: values.dueDate,
    dueTime,
    categoryId: values.categoryId,
    sectionId: values.sectionId,
  };
}

/** Avisa solo de una fecha anterior a hoy que además es nueva (CU-02 A4). */
export function isNewPastDate(
  dueDate: CalendarDate | null,
  originalDueDate: CalendarDate | null,
  today: CalendarDate,
): boolean {
  if (dueDate === null || dueDate === originalDueDate) {
    return false;
  }
  return compareCalendarDates(dueDate, today) < 0;
}

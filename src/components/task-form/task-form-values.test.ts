import { describe, expect, it } from '@jest/globals';

import {
  EMPTY_TASK_FORM_VALUES,
  buildTaskInput,
  isNewPastDate,
  validateTaskForm,
} from './task-form-values';

describe('validateTaskForm', () => {
  it('requires a name', () => {
    expect(validateTaskForm(EMPTY_TASK_FORM_VALUES).name).toBeDefined();
  });

  it('rejects names over 120 characters but accepts exactly 120', () => {
    const tooLong = { ...EMPTY_TASK_FORM_VALUES, name: 'a'.repeat(121) };
    const justRight = { ...EMPTY_TASK_FORM_VALUES, name: 'a'.repeat(120) };

    expect(validateTaskForm(tooLong).name).toBeDefined();
    expect(validateTaskForm(justRight)).toEqual({});
  });
});

describe('buildTaskInput', () => {
  it('drops a time that has no date', () => {
    const values = {
      ...EMPTY_TASK_FORM_VALUES,
      name: 'x',
      dueDate: null,
      dueTime: '10:00',
    };

    expect(buildTaskInput(values).dueTime).toBeNull();
  });
});

describe('isNewPastDate', () => {
  it('is true only for a changed date before today', () => {
    expect(isNewPastDate('2026-10-06', null, '2026-10-07')).toBe(true);
    expect(isNewPastDate('2026-10-07', null, '2026-10-07')).toBe(false);
    expect(isNewPastDate('2026-10-06', '2026-10-06', '2026-10-07')).toBe(false);
    expect(isNewPastDate(null, '2026-10-06', '2026-10-07')).toBe(false);
  });
});

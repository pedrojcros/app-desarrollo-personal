import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';

import { createCategory } from './categories';
import { supabase } from './supabase/client';
import {
  createAdminClient,
  createTestUser,
  deleteTestUser,
  waitForLocalSchema,
  type TestUser,
} from './supabase/local-supabase';
import {
  archiveTask,
  createTask,
  fetchTask,
  rescheduleTask,
  updateTask,
  type TaskInput,
} from './tasks';

// Solo sustituye el almacenamiento nativo; las consultas usan Supabase local real.
jest.mock('./supabase/client', () => {
  const { createClient } = jest.requireActual<
    typeof import('@supabase/supabase-js')
  >('@supabase/supabase-js');
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Local Supabase environment variables are required');
  }
  return {
    supabase: createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  };
});

const TIME_ZONE = 'Europe/Madrid';

let adminClient: SupabaseClient;
let user: TestUser;

function buildInput(overrides: Partial<TaskInput> = {}): TaskInput {
  return {
    name: 'Comprar leche',
    notes: null,
    dueDate: null,
    dueTime: null,
    categoryId: null,
    sectionId: null,
    ...overrides,
  };
}

async function createTaskOrThrow(input: TaskInput): Promise<string> {
  const result = await createTask(input);
  if (!result.ok) {
    throw new Error(`Could not create task: ${result.error.message}`);
  }
  return result.value.id;
}

async function fetchTaskOrThrow(taskId: string) {
  const result = await fetchTask(taskId, TIME_ZONE);
  if (!result.ok) {
    throw new Error(`Could not read task: ${result.error.message}`);
  }
  return result.value;
}

async function countOwnTasks(): Promise<number> {
  const response = await user.client
    .from('tasks')
    .select('id', { count: 'exact', head: true });
  if (response.error) {
    throw response.error;
  }
  return response.count ?? 0;
}

beforeAll(async () => {
  await waitForLocalSchema();
  adminClient = createAdminClient();
  user = await createTestUser(adminClient);
  const session = await user.client.auth.getSession();
  if (!session.data.session) {
    throw new Error('Test user must have a session');
  }
  const authentication = await supabase.auth.setSession(session.data.session);
  expect(authentication.error).toBeNull();
}, 35000);

afterAll(async () => {
  await deleteTestUser(adminClient, user);
});

describe('CU-02 scenario 1: task without date', () => {
  it('is pending, never due and lives in the Inbox', async () => {
    const taskId = await createTaskOrThrow(buildInput());

    const task = await fetchTaskOrThrow(taskId);

    expect(task.name).toBe('Comprar leche');
    expect(task.status).toBe('pending');
    expect(task.dueDate).toBeNull();
    expect(task.dueTime).toBeNull();
    expect(task.categoryId).toBeNull();
    expect(task.sectionId).toBeNull();
  });
});

describe('CU-02 scenario 2: task with date', () => {
  it('keeps the date, the time and the notes', async () => {
    const taskId = await createTaskOrThrow(
      buildInput({
        name: 'Entregar práctica',
        notes: 'Subirla al campus',
        dueDate: '2026-10-20',
        dueTime: '09:30',
      }),
    );

    const task = await fetchTaskOrThrow(taskId);

    expect(task.status).toBe('pending');
    expect(task.dueDate).toBe('2026-10-20');
    expect(task.dueTime).toBe('09:30');
    expect(task.notes).toBe('Subirla al campus');
  });
});

describe('CU-02 scenario 3: past date', () => {
  it('creates the task already overdue', async () => {
    const taskId = await createTaskOrThrow(
      buildInput({ name: 'Pagar el recibo', dueDate: '2020-01-15' }),
    );

    const task = await fetchTaskOrThrow(taskId);

    expect(task.dueDate).toBe('2020-01-15');
    expect(task.status).toBe('pending');
  });
});

describe('CU-02 scenario 4: empty name', () => {
  it('does not create anything and says the name is required', async () => {
    const taskCountBefore = await countOwnTasks();

    const result = await createTask(buildInput({ name: '   ' }));

    expect(result).toEqual({
      ok: false,
      error: { code: 'invalid_input', message: 'Name is required' },
    });
    expect(await countOwnTasks()).toBe(taskCountBefore);
  });

  it('rejects a time without a date and names over 120 characters', async () => {
    const timeWithoutDate = await createTask(buildInput({ dueTime: '08:00' }));
    const longName = await createTask(buildInput({ name: 'a'.repeat(121) }));

    expect(timeWithoutDate.ok).toBe(false);
    expect(longName.ok).toBe(false);
  });

  it('trims the name and stores blank notes as no notes', async () => {
    const taskId = await createTaskOrThrow(
      buildInput({ name: '  Llamar al médico  ', notes: '   ' }),
    );

    const task = await fetchTaskOrThrow(taskId);

    expect(task.name).toBe('Llamar al médico');
    expect(task.notes).toBeNull();
  });
});

describe('CU-02 scenario 5: task in a category', () => {
  it('is pending and inside the category and section', async () => {
    const categoryResult = await createCategory({
      name: 'Compra',
      icon: 'star',
      color: 'teal',
    });
    if (!categoryResult.ok) {
      throw new Error(categoryResult.error.message);
    }
    const categoryId = categoryResult.value.id;

    const taskId = await createTaskOrThrow(
      buildInput({ name: 'Leche', categoryId }),
    );

    const task = await fetchTaskOrThrow(taskId);
    expect(task.categoryId).toBe(categoryId);
    expect(task.status).toBe('pending');
  });

  it('reports not_found when the category does not exist', async () => {
    const result = await createTask(
      buildInput({ categoryId: '00000000-0000-4000-8000-000000000000' }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('not_found');
    }
  });
});

describe('CU-06 scenario 1: rename', () => {
  it('shows the new name and keeps the mark and the other data', async () => {
    const taskId = await createTaskOrThrow(
      buildInput({ name: 'Comprar lece', dueDate: '2026-10-20' }),
    );
    const markResponse = await user.client
      .from('tasks')
      .update({ status: 'done', marked_at: new Date().toISOString() })
      .eq('id', taskId);
    expect(markResponse.error).toBeNull();

    const result = await updateTask(
      taskId,
      buildInput({ name: 'Comprar leche', dueDate: '2026-10-20' }),
    );

    expect(result).toEqual({ ok: true, value: null });
    const task = await fetchTaskOrThrow(taskId);
    expect(task.name).toBe('Comprar leche');
    expect(task.status).toBe('done');
    expect(task.markedAt).not.toBeNull();
  });

  it('can remove the date and the time', async () => {
    const taskId = await createTaskOrThrow(
      buildInput({ dueDate: '2026-10-20', dueTime: '10:00' }),
    );

    await updateTask(taskId, buildInput());

    const task = await fetchTaskOrThrow(taskId);
    expect(task.dueDate).toBeNull();
    expect(task.dueTime).toBeNull();
  });

  it('reports not_found for a task that does not exist', async () => {
    const result = await updateTask(
      '00000000-0000-4000-8000-000000000000',
      buildInput(),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('not_found');
    }
  });
});

describe('CU-06 scenario 3: archive', () => {
  it('keeps the row with its history but the task can no longer be opened', async () => {
    const taskId = await createTaskOrThrow(buildInput({ name: 'Vieja' }));

    const result = await archiveTask(taskId);

    expect(result).toEqual({ ok: true, value: null });
    const row = await user.client
      .from('tasks')
      .select('archived_at, name')
      .eq('id', taskId)
      .single();
    expect(row.data?.archived_at).not.toBeNull();
    expect(row.data?.name).toBe('Vieja');
    const fetched = await fetchTask(taskId, TIME_ZONE);
    expect(fetched.ok).toBe(false);
    const archivedAgain = await archiveTask(taskId);
    expect(archivedAgain.ok).toBe(false);
  });
});

describe('CU-06 scenario 4: empty name', () => {
  it('does not save and leaves the task as it was', async () => {
    const taskId = await createTaskOrThrow(buildInput({ name: 'Intacta' }));

    const result = await updateTask(taskId, buildInput({ name: '' }));

    expect(result.ok).toBe(false);
    const task = await fetchTaskOrThrow(taskId);
    expect(task.name).toBe('Intacta');
  });
});

describe('CU-04 scenario 2: reschedule an overdue task', () => {
  it('moves it to the new date, keeps the time and leaves it pending', async () => {
    const taskId = await createTaskOrThrow(
      buildInput({ dueDate: '2026-10-06', dueTime: '18:30' }),
    );

    const result = await rescheduleTask(taskId, '2026-10-08', '2026-10-07');

    expect(result).toEqual({ ok: true, value: null });
    const task = await fetchTaskOrThrow(taskId);
    expect(task.status).toBe('pending');
    expect(task.dueDate).toBe('2026-10-08');
    expect(task.dueTime).toBe('18:30');
  });

  it('accepts today as the new date', async () => {
    const taskId = await createTaskOrThrow(
      buildInput({ dueDate: '2026-10-01' }),
    );

    const result = await rescheduleTask(taskId, '2026-10-07', '2026-10-07');

    expect(result.ok).toBe(true);
  });
});

describe('CU-04 scenario 3: reschedule to the past', () => {
  it('is refused with past_date and the task does not change', async () => {
    const taskId = await createTaskOrThrow(
      buildInput({ dueDate: '2026-10-01', dueTime: '09:00' }),
    );

    const result = await rescheduleTask(taskId, '2026-10-06', '2026-10-07');

    expect(result).toMatchObject({ ok: false, error: { code: 'past_date' } });
    const task = await fetchTaskOrThrow(taskId);
    expect(task.dueDate).toBe('2026-10-01');
    expect(task.dueTime).toBe('09:00');
  });

  it('rejects a malformed date as invalid_input', async () => {
    const taskId = await createTaskOrThrow(
      buildInput({ dueDate: '2026-10-01' }),
    );

    const result = await rescheduleTask(taskId, 'mañana', '2026-10-07');

    expect(result).toMatchObject({
      ok: false,
      error: { code: 'invalid_input' },
    });
  });

  it('reports not_found for an archived task', async () => {
    const taskId = await createTaskOrThrow(
      buildInput({ dueDate: '2026-10-01' }),
    );
    await archiveTask(taskId);

    const result = await rescheduleTask(taskId, '2026-10-08', '2026-10-07');

    expect(result).toMatchObject({ ok: false, error: { code: 'not_found' } });
  });
});

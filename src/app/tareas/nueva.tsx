import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import {
  EMPTY_TASK_FORM_VALUES,
  TaskForm,
  describeTaskSaveError,
} from '@/components/task-form';
import { useCreateTask, type TaskInput } from '@/data/tasks';
import { useToday } from '@/data/use-today';
import { parseCalendarDate } from '@/domain/calendar-date';
import type { CalendarDate } from '@/domain/types';

type NewTaskParams = {
  name?: string;
  categoryId?: string;
  sectionId?: string;
  dueDate?: string;
};

// Un parámetro de ruta mal escrito no debe romper la pantalla: se ignora.
function readDueDate(value: string | undefined): CalendarDate | null {
  if (value === undefined) {
    return null;
  }
  try {
    return parseCalendarDate(value);
  } catch {
    return null;
  }
}

export default function NewTaskScreen() {
  const params = useLocalSearchParams<NewTaskParams>();
  const router = useRouter();
  const today = useToday();
  const createTask = useCreateTask();
  const [saveError, setSaveError] = useState<string>();
  const initialValues = {
    ...EMPTY_TASK_FORM_VALUES,
    name: params.name ?? '',
    categoryId: params.categoryId ?? null,
    sectionId: params.sectionId ?? null,
    dueDate: readDueDate(params.dueDate),
  };

  function goBack(): void {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/hoy');
  }

  function save(input: TaskInput): void {
    setSaveError(undefined);
    createTask.mutate(input, {
      onSuccess: goBack,
      onError: (error) => setSaveError(describeTaskSaveError(error.code)),
    });
  }

  return (
    <TaskForm
      mode="create"
      initialValues={initialValues}
      today={today}
      isSaving={createTask.isPending}
      saveError={saveError}
      onSubmit={save}
    />
  );
}

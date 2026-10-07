import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import {
  TaskForm,
  describeTaskArchiveError,
  describeTaskSaveError,
  type TaskFormValues,
} from '@/components/task-form';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import {
  useArchiveTask,
  useTask,
  useUpdateTask,
  type TaskInput,
} from '@/data/tasks';
import { useToday } from '@/data/use-today';
import type { Task } from '@/domain/entities';

function toFormValues(task: Task): TaskFormValues {
  return {
    name: task.name,
    notes: task.notes ?? '',
    dueDate: task.dueDate,
    dueTime: task.dueTime,
    categoryId: task.categoryId,
    sectionId: task.sectionId,
  };
}

function ReadFailure({
  isMissing,
  onRetry,
}: {
  isMissing: boolean;
  onRetry: () => void;
}) {
  if (isMissing) {
    return <Text className="p-4">Esta tarea ya no existe.</Text>;
  }
  return (
    <View className="gap-3 p-4">
      <Text accessibilityRole="alert">No se pudo cargar la tarea.</Text>
      <Button onPress={onRetry} className="self-start">
        <Text>Reintentar</Text>
      </Button>
    </View>
  );
}

function EditTask({ task }: { task: Task }) {
  const router = useRouter();
  const today = useToday();
  const updateTask = useUpdateTask();
  const archiveTask = useArchiveTask();
  const [saveError, setSaveError] = useState<string>();
  const [archiveError, setArchiveError] = useState<string>();

  function goBack(): void {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/hoy');
  }

  function save(input: TaskInput): void {
    setSaveError(undefined);
    updateTask.mutate(
      { taskId: task.id, input },
      {
        onSuccess: goBack,
        onError: (error) => setSaveError(describeTaskSaveError(error.code)),
      },
    );
  }

  function archive(): void {
    setArchiveError(undefined);
    archiveTask.mutate(task.id, {
      onSuccess: goBack,
      onError: (error) => setArchiveError(describeTaskArchiveError(error.code)),
    });
  }

  return (
    <TaskForm
      mode="edit"
      initialValues={toFormValues(task)}
      today={today}
      isSaving={updateTask.isPending}
      saveError={saveError}
      onSubmit={save}
      onArchive={archive}
      isArchiving={archiveTask.isPending}
      archiveError={archiveError}
    />
  );
}

export default function TaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const taskQuery = useTask(id);
  if (taskQuery.isPending) {
    return <Text className="p-4">Cargando tarea…</Text>;
  }
  if (taskQuery.isError) {
    const isMissing = taskQuery.error.code === 'not_found';
    return (
      <ReadFailure
        isMissing={isMissing}
        onRetry={() => {
          void taskQuery.refetch();
        }}
      />
    );
  }
  return <EditTask task={taskQuery.data} />;
}

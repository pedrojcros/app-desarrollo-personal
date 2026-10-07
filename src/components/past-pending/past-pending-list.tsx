import { router } from 'expo-router';
import { CalendarDays } from 'lucide-react-native';
import { useState } from 'react';
import { SectionList, View } from 'react-native';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { ListRow } from '@/components/ui/list-row';
import { Text } from '@/components/ui/text';
import { useMarkItem } from '@/data/marks';
import { useRescheduleTask } from '@/data/tasks';
import { getMarkTargetKey, type ViewItem } from '@/domain/items';
import type { CalendarDate } from '@/domain/types';
import { describeDay, groupByDay } from '@/domain/views/past-pending';

import { DayHeader } from './day-header';
import { RescheduleDialog } from './reschedule-dialog';

const RESCHEDULE_FAILED_MESSAGE =
  'No se ha podido reprogramar. Inténtalo de nuevo.';

type PastPendingListProps = {
  items: ViewItem[];
  today: CalendarDate;
};

function openItem(item: ViewItem): void {
  if (item.target.kind === 'task') {
    router.push({
      pathname: '/tareas/[id]',
      params: { id: item.target.taskId },
    });
    return;
  }
  router.push({
    pathname: '/habitos/[id]',
    params: { id: item.target.habitId },
  });
}

// El día ya está en la cabecera del grupo: aquí solo la hora y el tipo.
function describeItem(item: ViewItem): string {
  const kind = item.target.kind === 'task' ? 'Tarea' : 'Hábito';
  if (item.sortTime === null) {
    return kind;
  }
  return `${item.sortTime} · ${kind}`;
}

type PendingDay = { title: string; items: ViewItem[] };

function describeConfirmation(count: number): string {
  if (count === 1) {
    return 'Se marcará como no hecha la cosa pendiente de ese día.';
  }
  return `Se marcarán como no hechas las ${count} cosas pendientes de ese día.`;
}

type RescheduleFlowProps = {
  task: ViewItem;
  today: CalendarDate;
  onClose: () => void;
};

function RescheduleFlow({ task, today, onClose }: RescheduleFlowProps) {
  const rescheduleTask = useRescheduleTask();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  function save(newDueDate: CalendarDate): void {
    if (task.target.kind !== 'task') {
      return;
    }
    const variables = { taskId: task.target.taskId, newDueDate };
    rescheduleTask.mutate(variables, {
      onSuccess: onClose,
      onError: () => setErrorMessage(RESCHEDULE_FAILED_MESSAGE),
    });
  }

  return (
    <RescheduleDialog
      taskName={task.name}
      today={today}
      errorMessage={errorMessage}
      isSaving={rescheduleTask.isPending}
      onSave={save}
      onCancel={onClose}
    />
  );
}

export function PastPendingList({ items, today }: PastPendingListProps) {
  const { markItem, markItems } = useMarkItem();
  const [taskToReschedule, setTaskToReschedule] = useState<ViewItem | null>(
    null,
  );
  const [dayToMark, setDayToMark] = useState<PendingDay | null>(null);
  // Lo marcado sigue en la caché (para poder deshacer), pero sale de la lista.
  const pendingItems = items.filter((item) => item.status === 'pending');
  const groups = groupByDay(pendingItems);
  const sections = groups.map((group) => ({
    key: group.date,
    title: describeDay(group.date, today),
    data: group.items,
  }));

  function markDayAsNotDone(): void {
    if (dayToMark === null) {
      return;
    }
    markItems(dayToMark.items, 'not_done');
    setDayToMark(null);
  }

  // Reprogramar solo existe para tareas: cada ocurrencia pertenece a su día (RN-15).
  function getRescheduleAction(item: ViewItem) {
    if (item.target.kind !== 'task') {
      return undefined;
    }
    return {
      label: `Reprogramar ${item.name}`,
      icon: CalendarDays,
      onPress: () => setTaskToReschedule(item),
    };
  }

  return (
    <View className="flex-1">
      <SectionList
        sections={sections}
        keyExtractor={(item) => getMarkTargetKey(item.target)}
        contentInsetAdjustmentBehavior="automatic"
        stickySectionHeadersEnabled={false}
        className="flex-1"
        ListEmptyComponent={<Text className="py-6">Todo al día.</Text>}
        renderSectionHeader={({ section }) => (
          <DayHeader
            title={section.title}
            onMarkAllNotDone={() =>
              setDayToMark({ title: section.title, items: section.data })
            }
          />
        )}
        renderItem={({ item }) => (
          <ListRow
            title={item.name}
            meta={describeItem(item)}
            onPress={() => openItem(item)}
            onMarkDone={() => markItem(item, 'done')}
            onMarkNotDone={() => markItem(item, 'not_done')}
            secondaryAction={getRescheduleAction(item)}
          />
        )}
        ListFooterComponent={<View className="h-6" />}
      />
      {taskToReschedule !== null ? (
        <RescheduleFlow
          task={taskToReschedule}
          today={today}
          onClose={() => setTaskToReschedule(null)}
        />
      ) : null}
      <ConfirmDialog
        visible={dayToMark !== null}
        title="¿Marcar el día como no hecho?"
        message={describeConfirmation(dayToMark?.items.length ?? 0)}
        confirmLabel="Marcar como no hecho"
        destructive
        onConfirm={markDayAsNotDone}
        onCancel={() => setDayToMark(null)}
      />
    </View>
  );
}

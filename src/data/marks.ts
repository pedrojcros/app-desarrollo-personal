import {
  QueryClient,
  useIsMutating,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import { useUndoToast } from '@/components/undo-toast';

import {
  applyStatusToItems,
  getMarkTargetKey,
  type ItemStatus,
  type MarkTarget,
  type ViewData,
  type ViewItem,
} from '../domain/items';
import type { CalendarDate } from '../domain/types';
import { queryKeys } from './query-keys';
import { DataResultError, unwrapResult } from './result';
import {
  isFutureOccurrence,
  restoreMarkStatus,
  setMarkStatus,
  type MarkOutcome,
} from './set-mark-status';
import { useToday } from './use-today';

// setMarkStatus vive aparte para que los tests de integración (que corren sin
// React Native) puedan importarlo; las vistas lo encuentran igualmente aquí.
export { setMarkStatus };

interface StatusChange {
  restorePreviousInstant?: boolean;
  // En un lote, el aviso de fallo lo da el lote entero, no cada elemento.
  reportsFailureItself?: boolean;
  target: MarkTarget;
  status: ItemStatus;
  markedAt: string | null;
  // Estado al que se vuelve solo para este elemento si el guardado falla.
  previousStatus: ItemStatus;
  previousMarkedAt: string | null;
}

interface MarkSequence {
  latest: StatusChange;
  savedStatus: ItemStatus;
  savedMarkedAt: string | null;
  pendingSave?: Promise<MarkOutcome>;
}

const markSequences = new WeakMap<QueryClient, Map<string, MarkSequence>>();
const mutationKey = ['marks'] as const;

function getSequences(queryClient: QueryClient): Map<string, MarkSequence> {
  const existing = markSequences.get(queryClient);
  if (existing) {
    return existing;
  }
  const sequences = new Map<string, MarkSequence>();
  markSequences.set(queryClient, sequences);
  return sequences;
}

function startSequence(
  queryClient: QueryClient,
  change: StatusChange,
): MarkSequence {
  const sequences = getSequences(queryClient);
  const targetKey = getMarkTargetKey(change.target);
  const existing = sequences.get(targetKey);
  if (existing) {
    existing.latest = change;
    return existing;
  }
  const sequence: MarkSequence = {
    latest: change,
    savedStatus: change.previousStatus,
    savedMarkedAt: change.previousMarkedAt,
  };
  sequences.set(targetKey, sequence);
  return sequence;
}

async function saveAfterPrevious(
  previousSave: Promise<MarkOutcome> | undefined,
  change: StatusChange,
  today: CalendarDate,
): Promise<MarkOutcome> {
  if (previousSave) {
    await previousSave;
  }
  if (change.restorePreviousInstant) {
    return restoreMarkStatus(
      change.target,
      change.status,
      today,
      change.markedAt,
    );
  }
  return setMarkStatus(change.target, change.status, today);
}

async function saveInSequence(
  sequence: MarkSequence,
  change: StatusChange,
  today: CalendarDate,
) {
  // Solo se ordenan las escrituras del mismo elemento: Deshacer nunca adelanta a su marca.
  const pendingSave = saveAfterPrevious(sequence.pendingSave, change, today);
  sequence.pendingSave = pendingSave;
  const result = await pendingSave;
  if (result.ok) {
    sequence.savedStatus = change.status;
    sequence.savedMarkedAt = result.value.markedAt;
  }
  return unwrapResult(result);
}

function patchAllViews(
  queryClient: ReturnType<typeof useQueryClient>,
  target: MarkTarget,
  status: ItemStatus,
  markedAt: string | null,
): void {
  queryClient.setQueriesData<ViewData>(
    { queryKey: queryKeys.views() },
    (viewData) => {
      if (viewData === undefined) {
        return viewData;
      }
      const items = applyStatusToItems(
        viewData.items,
        target,
        status,
        markedAt,
      );
      return { ...viewData, items };
    },
  );
}

function describeSavedStatus(status: ItemStatus): string {
  if (status === 'done') {
    return 'Marcada como hecha';
  }
  if (status === 'not_done') {
    return 'Marcada como no hecha';
  }
  return 'Devuelta a pendiente';
}

const PLURAL_STATUS_DESCRIPTIONS: Record<ItemStatus, string> = {
  done: 'marcadas como hechas',
  not_done: 'marcadas como no hechas',
  pending: 'devueltas a pendiente',
};
const SINGULAR_STATUS_DESCRIPTIONS: Record<ItemStatus, string> = {
  done: 'marcada como hecha',
  not_done: 'marcada como no hecha',
  pending: 'devuelta a pendiente',
};

function describeBatchStatus(status: ItemStatus, count: number): string {
  if (count === 1) {
    return `1 ${SINGULAR_STATUS_DESCRIPTIONS[status]}`;
  }
  return `${count} ${PLURAL_STATUS_DESCRIPTIONS[status]}`;
}

function describePartialBatch(
  status: ItemStatus,
  savedCount: number,
  totalCount: number,
): string {
  const description = PLURAL_STATUS_DESCRIPTIONS[status];
  return `${savedCount} de ${totalCount} ${description}. El resto no se ha podido guardar.`;
}

const FUTURE_DATE_MESSAGE =
  'Todavía no se puede marcar: ese día no ha llegado.';
const SAVE_FAILED_MESSAGE = 'No se ha podido guardar. Inténtalo de nuevo.';

function describeFailureForUser(error: unknown): string {
  if (error instanceof DataResultError && error.code === 'future_date') {
    return FUTURE_DATE_MESSAGE;
  }
  return SAVE_FAILED_MESSAGE;
}

/** Lo que usan las vistas: marcar un elemento que tienen en pantalla. */
export function useMarkItem(): {
  markItem: (item: ViewItem, status: ItemStatus) => void;
  markItems: (items: ViewItem[], status: ItemStatus) => void;
  isMarking: boolean;
} {
  const queryClient = useQueryClient();
  const today = useToday();
  const { showNotice } = useUndoToast();

  const sequences = getSequences(queryClient);
  const markingCount = useIsMutating({ mutationKey });
  const mutation = useMutation({
    mutationKey,
    mutationFn: (change: StatusChange) => {
      const targetKey = getMarkTargetKey(change.target);
      const sequence = sequences.get(targetKey)!;
      return saveInSequence(sequence, change, today);
    },
    onMutate: async (change: StatusChange) => {
      const sequence = startSequence(queryClient, change);
      await queryClient.cancelQueries({ queryKey: queryKeys.views() });
      patchAllViews(queryClient, change.target, change.status, change.markedAt);
      return sequence;
    },
    onSuccess: (value, change, sequence) => {
      if (sequence.latest === change) {
        patchAllViews(
          queryClient,
          change.target,
          change.status,
          value.markedAt,
        );
      }
    },
    onError: (error: unknown, change: StatusChange, sequence) => {
      // Una respuesta antigua no debe borrar una marca más reciente del mismo elemento.
      if (sequence?.latest === change) {
        patchAllViews(
          queryClient,
          change.target,
          sequence.savedStatus,
          sequence.savedMarkedAt,
        );
      }
      if (!change.reportsFailureItself) {
        showNotice({ message: describeFailureForUser(error) });
      }
    },
    onSettled: (value, error, change, sequence) => {
      if (sequence?.latest === change) {
        const targetKey = getMarkTargetKey(change.target);
        sequences.delete(targetKey);
      }
      // Se invalidan siempre; se releen al acabar la última para no pisar parches en vuelo.
      const hasOtherMarks = queryClient.isMutating({ mutationKey }) > 1;
      const refetchType = hasOtherMarks ? 'none' : 'active';
      return queryClient.invalidateQueries({
        queryKey: queryKeys.views(),
        refetchType,
      });
    },
  });

  function buildChanges(item: ViewItem, status: ItemStatus) {
    const instant = new Date();
    const markedAt = status === 'pending' ? null : instant.toISOString();
    const change: StatusChange = {
      target: item.target,
      status,
      markedAt,
      previousStatus: item.status,
      previousMarkedAt: item.markedAt,
    };
    const undoChange: StatusChange = {
      restorePreviousInstant: true,
      target: item.target,
      status: item.status,
      markedAt: item.markedAt,
      previousStatus: status,
      previousMarkedAt: markedAt,
    };
    return { change, undoChange };
  }

  function markItem(item: ViewItem, status: ItemStatus): void {
    if (isFutureOccurrence(item.target, today)) {
      showNotice({ message: FUTURE_DATE_MESSAGE });
      return;
    }

    const { change, undoChange } = buildChanges(item, status);
    // Deshacer es otro cambio normal, pero sin un nuevo aviso con «Deshacer».
    showNotice({
      message: describeSavedStatus(status),
      actionLabel: 'Deshacer',
      onAction: () => mutation.mutate(undoChange),
    });
    mutation.mutate(change);
  }

  // Un solo aviso para todo el lote. Cada elemento sigue la misma secuencia de
  // guardado que `markItem`, así que el orden y los parches de caché no cambian.
  function markItems(items: ViewItem[], status: ItemStatus): void {
    if (items.length === 0) {
      return;
    }
    const hasFutureItem = items.some((item) =>
      isFutureOccurrence(item.target, today),
    );
    if (hasFutureItem) {
      showNotice({ message: FUTURE_DATE_MESSAGE });
      return;
    }

    const entries = items.map((item) => buildChanges(item, status));
    showNotice({
      message: describeBatchStatus(status, items.length),
      actionLabel: 'Deshacer',
      onAction: () => undoEntries(entries),
    });
    void saveBatch(entries, status);
  }

  function undoEntries(entries: { undoChange: StatusChange }[]): void {
    for (const entry of entries) {
      mutation.mutate(entry.undoChange);
    }
  }

  async function saveBatch(
    entries: { change: StatusChange; undoChange: StatusChange }[],
    status: ItemStatus,
  ): Promise<void> {
    const saves = entries.map((entry) =>
      mutation.mutateAsync({ ...entry.change, reportsFailureItself: true }),
    );
    const outcomes = await Promise.allSettled(saves);
    const savedEntries = entries.filter(
      (entry, index) => outcomes[index].status === 'fulfilled',
    );
    if (savedEntries.length === entries.length) {
      return;
    }
    if (savedEntries.length === 0) {
      showNotice({ message: SAVE_FAILED_MESSAGE });
      return;
    }
    showNotice({
      message: describePartialBatch(
        status,
        savedEntries.length,
        entries.length,
      ),
      actionLabel: 'Deshacer',
      onAction: () => undoEntries(savedEntries),
    });
  }

  return { markItem, markItems, isMarking: markingCount > 0 };
}

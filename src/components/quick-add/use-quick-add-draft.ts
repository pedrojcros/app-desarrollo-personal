import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { TextInput } from 'react-native';
import { describeTaskSaveError } from '@/components/task-form/task-messages';
import { useCreateTask } from '@/data/tasks';
import { useCreateHabit, type HabitInput } from '@/data/habits';
import { useToday } from '@/data/use-today';
import { getQuickAddStartDate } from '@/domain/quick-add';
import type { QuickHabitOptions } from './habit-options';
import type { QuickAddDefaults } from './quick-add-provider';

export function useQuickAddDraft(
  defaults: QuickAddDefaults,
  close: () => void,
) {
  const today = useToday();
  const router = useRouter();
  const createTask = useCreateTask();
  const createHabit = useCreateHabit();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'task' | 'habit'>('task');
  const [place, setPlace] = useState({
    categoryId: defaults.categoryId,
    sectionId: defaults.sectionId,
  });
  const [dueDate, setDueDate] = useState(defaults.dueDate);
  const [startDate, setStartDate] = useState(
    getQuickAddStartDate(defaults.dueDate, today),
  );
  const [options, setOptions] = useState<QuickHabitOptions>({
    frequency: 'daily',
    weekdays: [],
    intervalText: '1',
    moment: 'none',
    timeOfDay: '09:00',
  });
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const submissionInProgress = useRef(false);
  const nameInput = useRef<TextInput>(null);
  const focusAfterSave = useRef(false);
  const disabled = saving || createTask.isPending || createHabit.isPending;
  const setNameInputRef = useCallback((input: TextInput | null) => {
    nameInput.current = input;
  }, []);

  useEffect(() => {
    if (disabled || !focusAfterSave.current) {
      return;
    }
    // Android debe recibir el foco después de volver a habilitar el campo.
    nameInput.current?.focus();
    focusAfterSave.current = false;
  }, [disabled]);

  function validate(): string | undefined {
    const trimmedName = name.trim();
    if (kind === 'task') {
      if (trimmedName.length === 0) {
        return 'El nombre es obligatorio.';
      }
      if (trimmedName.length > 120) {
        return 'El nombre puede tener hasta 120 caracteres.';
      }
      return;
    }
    if (trimmedName.length === 0 || trimmedName.length > 80) {
      return 'Escribe un nombre de 1 a 80 caracteres.';
    }
    if (options.frequency === 'weekdays' && options.weekdays.length === 0) {
      return 'Elige al menos un día.';
    }
    const intervalDays = Number(options.intervalText);
    const validInterval =
      Number.isInteger(intervalDays) &&
      intervalDays >= 1 &&
      intervalDays <= 365;
    if (options.frequency === 'every_n_days' && !validInterval) {
      return 'Escribe un número entero de 1 a 365.';
    }
  }
  function buildHabitInput(): HabitInput {
    let timeSlot: HabitInput['timeSlot'] = null;
    if (options.moment !== 'none' && options.moment !== 'exact') {
      timeSlot = options.moment;
    }
    return {
      name: name.trim(),
      ...place,
      startDate,
      frequency: options.frequency,
      weekdays: options.frequency === 'weekdays' ? options.weekdays : [],
      intervalDays:
        options.frequency === 'every_n_days'
          ? Number(options.intervalText)
          : null,
      timeSlot,
      timeOfDay: options.moment === 'exact' ? options.timeOfDay : null,
    };
  }
  async function submit(): Promise<void> {
    if (submissionInProgress.current || disabled) {
      return;
    }
    const validationError = validate();
    setError(validationError);
    if (validationError !== undefined) {
      return;
    }
    submissionInProgress.current = true;
    setSaving(true);
    try {
      if (kind === 'task') {
        await createTask.mutateAsync({
          name: name.trim(),
          ...place,
          dueDate,
          dueTime: null,
          notes: null,
        });
      } else {
        await createHabit.mutateAsync(buildHabitInput());
      }
      setName('');
      focusAfterSave.current = true;
    } catch (failure) {
      if (kind === 'habit') {
        setError(
          'No se pudo guardar. Tus cambios siguen aquí; inténtalo de nuevo.',
        );
      } else {
        const code = readErrorCode(failure);
        setError(describeTaskSaveError(code));
      }
    } finally {
      submissionInProgress.current = false;
      setSaving(false);
    }
  }
  function openMore(): void {
    const routeParameters: Record<string, string> = { name };
    if (place.categoryId !== null) {
      routeParameters.categoryId = place.categoryId;
    }
    if (place.sectionId !== null) {
      routeParameters.sectionId = place.sectionId;
    }
    if (kind === 'habit') {
      routeParameters.startDate = startDate;
      router.push({ pathname: '/habitos/nuevo', params: routeParameters });
    } else {
      if (dueDate !== null) {
        routeParameters.dueDate = dueDate;
      }
      router.push({ pathname: '/tareas/nueva', params: routeParameters });
    }
    close();
  }
  return {
    draft: {
      today,
      name,
      kind,
      place,
      dueDate,
      startDate,
      options,
    },
    actions: {
      setName,
      setKind,
      setPlace,
      setDueDate,
      setStartDate,
      setOptions,
      setError,
      setNameInputRef,
      submit,
      openMore,
    },
    status: {
      error,
      disabled,
    },
  };
}

function readErrorCode(failure: unknown): string {
  if (typeof failure !== 'object' || failure === null || !('code' in failure)) {
    return 'unknown_error';
  }
  return typeof failure.code === 'string' ? failure.code : 'unknown_error';
}

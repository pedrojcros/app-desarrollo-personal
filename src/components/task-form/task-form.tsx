import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { CategorySelect } from '@/components/category-select';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import type { TaskInput } from '@/data/tasks';
import type { CalendarDate } from '@/domain/types';

import { DueDateFields } from './due-date-fields';
import {
  buildTaskInput,
  hasErrors,
  isNewPastDate,
  validateTaskForm,
  type TaskFormErrors,
  type TaskFormValues,
} from './task-form-values';

export interface TaskFormProps {
  mode: 'create' | 'edit';
  initialValues: TaskFormValues;
  today: CalendarDate;
  isSaving: boolean;
  /** Mensaje del último intento fallido; el formulario conserva lo escrito. */
  saveError?: string;
  onSubmit: (input: TaskInput) => void;
  /** Solo al modificar: con él aparece «Archivar tarea». */
  onArchive?: () => void;
  isArchiving?: boolean;
  archiveError?: string;
}

const PAST_DATE_MESSAGES = {
  create: 'Esta tarea nacerá vencida. ¿Crearla igualmente?',
  edit: 'Esta tarea quedará vencida. ¿Guardarla igualmente?',
};

type ArchiveSectionProps = {
  isArchiving: boolean;
  errorMessage?: string;
  onAsk: () => void;
};

function ArchiveSection({
  isArchiving,
  errorMessage,
  onAsk,
}: ArchiveSectionProps) {
  return (
    <View className="gap-2">
      {errorMessage ? (
        <Text role="alert" accessibilityRole="alert">
          {errorMessage}
        </Text>
      ) : null}
      <Button
        variant="secondary"
        disabled={isArchiving}
        onPress={onAsk}
        className="self-start"
      >
        <Text>Archivar tarea</Text>
      </Button>
    </View>
  );
}

export function TaskForm({
  mode,
  initialValues,
  today,
  isSaving,
  saveError,
  onSubmit,
  onArchive,
  isArchiving = false,
  archiveError,
}: TaskFormProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<TaskFormErrors>({});
  const [isAskingAboutPastDate, setIsAskingAboutPastDate] = useState(false);
  const [isAskingToArchive, setIsAskingToArchive] = useState(false);
  const submitLabel = mode === 'create' ? 'Crear tarea' : 'Guardar cambios';

  function changeValues(changes: Partial<TaskFormValues>): void {
    setValues({ ...values, ...changes });
  }

  function submit(): void {
    const foundErrors = validateTaskForm(values);
    setErrors(foundErrors);
    if (hasErrors(foundErrors)) {
      return;
    }
    // Al crear, toda fecha es nueva; al modificar, solo la que se ha cambiado.
    const originalDueDate = mode === 'edit' ? initialValues.dueDate : null;
    const mustAsk = isNewPastDate(values.dueDate, originalDueDate, today);
    if (mustAsk) {
      setIsAskingAboutPastDate(true);
      return;
    }
    onSubmit(buildTaskInput(values));
  }

  function confirmPastDate(): void {
    setIsAskingAboutPastDate(false);
    onSubmit(buildTaskInput(values));
  }

  function confirmArchive(): void {
    setIsAskingToArchive(false);
    onArchive?.();
  }

  return (
    <View className="flex-1">
      <ScrollView
        contentContainerClassName="gap-5 p-4"
        keyboardShouldPersistTaps="handled"
      >
        <TextField
          label="Nombre"
          value={values.name}
          onChangeText={(name) => changeValues({ name })}
          error={errors.name}
          maxLength={200}
          returnKeyType="done"
        />
        <TextField
          label="Notas"
          value={values.notes}
          onChangeText={(notes) => changeValues({ notes })}
          multiline
          textAlignVertical="top"
          className="min-h-24 bg-surface px-3 py-2 text-body text-foreground"
        />
        <DueDateFields
          dueDate={values.dueDate}
          dueTime={values.dueTime}
          today={today}
          onChange={changeValues}
        />
        <View className="gap-1.5">
          <Text variant="callout" weight="semibold">
            Categoría
          </Text>
          <CategorySelect
            value={{
              categoryId: values.categoryId,
              sectionId: values.sectionId,
            }}
            onChange={changeValues}
          />
        </View>
        {saveError ? (
          <Text role="alert" accessibilityRole="alert">
            {saveError}
          </Text>
        ) : null}
        <Button onPress={submit} disabled={isSaving} className="self-start">
          <Text>{isSaving ? 'Guardando…' : submitLabel}</Text>
        </Button>
        {onArchive ? (
          <ArchiveSection
            isArchiving={isArchiving}
            errorMessage={archiveError}
            onAsk={() => setIsAskingToArchive(true)}
          />
        ) : null}
      </ScrollView>
      <ConfirmDialog
        visible={isAskingAboutPastDate}
        title="Fecha anterior a hoy"
        message={PAST_DATE_MESSAGES[mode]}
        confirmLabel={mode === 'create' ? 'Crear' : 'Guardar'}
        onConfirm={confirmPastDate}
        onCancel={() => setIsAskingAboutPastDate(false)}
      />
      <ConfirmDialog
        visible={isAskingToArchive}
        title="¿Archivar la tarea?"
        message="Dejará de aparecer, pero su historial se conserva."
        confirmLabel="Archivar"
        destructive
        onConfirm={confirmArchive}
        onCancel={() => setIsAskingToArchive(false)}
      />
    </View>
  );
}

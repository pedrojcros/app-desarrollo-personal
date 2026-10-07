import { useRef, useState } from 'react';
import { View } from 'react-native';
import { CategorySelect } from '@/components/category-select';
import { DateField } from '@/components/date-field';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { habitInputSchema, type HabitInput } from '@/data/habits';
import { useToday } from '@/data/use-today';
import { ScheduleFields } from './schedule-fields';

export interface HabitFormProps {
  initialValue?: Partial<HabitInput>;
  mode: 'create' | 'edit';
  onSubmit: (value: HabitInput) => Promise<void>;
  isPending?: boolean;
}
type FormErrors = Partial<Record<keyof HabitInput, string>>;

function describeFieldError(field: string): string {
  switch (field) {
    case 'name':
      return 'Escribe un nombre de 1 a 80 caracteres.';
    case 'weekdays':
      return 'Elige al menos un día.';
    case 'intervalDays':
      return 'Escribe un número entero de 1 a 365.';
    case 'startDate':
      return 'Elige una fecha de hoy en adelante.';
    case 'timeOfDay':
      return 'Elige una hora válida.';
    default:
      return 'Revisa este campo.';
  }
}

export function HabitForm({
  initialValue,
  mode,
  onSubmit,
  isPending = false,
}: HabitFormProps) {
  const today = useToday();
  const [value, setValue] = useState<HabitInput>(() => ({
    name: '',
    categoryId: null,
    sectionId: null,
    startDate: today,
    timeOfDay: null,
    timeSlot: null,
    frequency: 'daily',
    weekdays: [],
    intervalDays: null,
    ...initialValue,
  }));
  const [intervalText, setIntervalText] = useState(
    String(initialValue?.intervalDays ?? 1),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveError, setSaveError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const submissionInProgress = useRef(false);
  const originalStartDate = initialValue?.startDate ?? today;
  const startDateLocked = mode === 'edit' && originalStartDate <= today;
  const disabled = saving || isPending;
  const submitLabel = mode === 'create' ? 'Crear hábito' : 'Guardar cambios';

  function changeValue(changes: Partial<HabitInput>): void {
    setValue((previous) => ({ ...previous, ...changes }));
  }

  async function submit(): Promise<void> {
    if (submissionInProgress.current || isPending) {
      return;
    }
    const input = { ...value };
    if (value.frequency === 'every_n_days') {
      input.intervalDays = Number(intervalText);
    } else {
      input.intervalDays = null;
    }
    if (value.frequency !== 'weekdays') {
      input.weekdays = [];
    }
    const parsed = habitInputSchema.safeParse(input);
    const nextErrors: FormErrors = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof HabitInput;
        nextErrors[field] = describeFieldError(field);
      }
    }
    if (!startDateLocked && input.startDate < today) {
      nextErrors.startDate = describeFieldError('startDate');
    }
    setErrors(nextErrors);
    setSaveError(undefined);
    if (!parsed.success || Object.keys(nextErrors).length > 0) {
      return;
    }
    submissionInProgress.current = true;
    setSaving(true);
    try {
      await onSubmit(parsed.data);
    } catch {
      setSaveError(
        'No se pudo guardar. Tus cambios siguen aquí; inténtalo de nuevo.',
      );
    } finally {
      submissionInProgress.current = false;
      setSaving(false);
    }
  }

  return (
    <View className="gap-5">
      <TextField
        label="Nombre"
        value={value.name}
        onChangeText={(name) => changeValue({ name })}
        error={errors.name}
        editable={!disabled}
        autoCapitalize="sentences"
        returnKeyType="done"
      />
      <ScheduleFields
        value={value}
        intervalText={intervalText}
        onIntervalChange={setIntervalText}
        errors={errors}
        disabled={disabled}
        onChange={changeValue}
      />
      {startDateLocked ? (
        <View className="gap-1">
          <Text variant="callout" weight="semibold">
            Fecha de inicio: {value.startDate}
          </Text>
          <Text variant="caption" className="text-muted-foreground">
            Ya ha empezado: cambiarla reescribiría el pasado
          </Text>
        </View>
      ) : (
        <DateField
          label="Fecha de inicio"
          value={value.startDate}
          onChange={(startDate) => changeValue({ startDate })}
          minimumDate={today}
        />
      )}
      {errors.startDate ? <Text role="alert">{errors.startDate}</Text> : null}
      <View className="gap-2">
        <Text variant="callout" weight="semibold">
          Categoría y sección
        </Text>
        <CategorySelect
          value={{ categoryId: value.categoryId, sectionId: value.sectionId }}
          onChange={changeValue}
        />
        {errors.categoryId ? (
          <Text role="alert">{errors.categoryId}</Text>
        ) : null}
      </View>
      {saveError ? <Text role="alert">{saveError}</Text> : null}
      <Button
        accessibilityLabel={submitLabel}
        disabled={disabled}
        onPress={submit}
      >
        <Text>{disabled ? 'Guardando…' : submitLabel}</Text>
      </Button>
    </View>
  );
}

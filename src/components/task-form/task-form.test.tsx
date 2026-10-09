import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeScope } from '@/theme/theme-scope';

import { TaskForm, type TaskFormProps } from './task-form';
import { EMPTY_TASK_FORM_VALUES } from './task-form-values';

jest.mock('@react-native-community/datetimepicker', () => ({
  DateTimePickerAndroid: { open: jest.fn() },
}));
jest.mock('@/data/categories', () => ({
  useCategories: () => ({ data: [], isError: false }),
}));

const TODAY = '2026-10-07';

function renderForm(overrides: Partial<TaskFormProps> = {}) {
  const onSubmit = jest.fn();
  const properties: TaskFormProps = {
    mode: 'create',
    initialValues: EMPTY_TASK_FORM_VALUES,
    today: TODAY,
    isSaving: false,
    onSubmit,
    ...overrides,
  };
  const view = render(
    <ThemeScope themeName="white">
      <TaskForm {...properties} />
    </ThemeScope>,
  );
  return { onSubmit, view, properties };
}

describe('TaskForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits a task with only a name, trimmed, and no date', () => {
    const { onSubmit } = renderForm();

    fireEvent.changeText(screen.getByLabelText('Nombre'), '  Comprar leche ');
    fireEvent.press(screen.getByRole('button', { name: 'Crear tarea' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Comprar leche',
      notes: '',
      dueDate: null,
      dueTime: null,
      categoryId: null,
      sectionId: null,
    });
  });

  it('shows the error next to the name and does not submit when it is empty', () => {
    const { onSubmit } = renderForm();

    fireEvent.changeText(screen.getByLabelText('Nombre'), '   ');
    fireEvent.press(screen.getByRole('button', { name: 'Crear tarea' }));

    expect(screen.getByText('El nombre es obligatorio.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('offers no time while there is no date', () => {
    renderForm();

    expect(screen.queryByLabelText('Añadir hora')).toBeNull();
    expect(screen.queryByLabelText('Hora')).toBeNull();
  });

  it('offers a time once there is a date and drops it with the date', () => {
    const { onSubmit } = renderForm();
    fireEvent.changeText(screen.getByLabelText('Nombre'), 'Entregar práctica');

    fireEvent.press(screen.getByLabelText('Añadir fecha'));
    fireEvent.press(screen.getByLabelText('Añadir hora'));
    expect(screen.getByLabelText('Hora')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Sin fecha'));
    fireEvent.press(screen.getByRole('button', { name: 'Crear tarea' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ dueDate: null, dueTime: null }),
    );
  });

  it('submits date and time together', () => {
    const { onSubmit } = renderForm({
      initialValues: {
        ...EMPTY_TASK_FORM_VALUES,
        name: 'Reunión',
        dueDate: '2026-10-20',
        dueTime: '09:30',
      },
    });

    fireEvent.press(screen.getByRole('button', { name: 'Crear tarea' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ dueDate: '2026-10-20', dueTime: '09:30' }),
    );
  });

  it('asks before creating a task with a past date and creates it on confirm', () => {
    const { onSubmit } = renderForm({
      initialValues: {
        ...EMPTY_TASK_FORM_VALUES,
        name: 'Pagar el recibo',
        dueDate: '2026-10-01',
      },
    });

    fireEvent.press(screen.getByRole('button', { name: 'Crear tarea' }));

    expect(
      screen.getByText('Esta tarea nacerá vencida. ¿Crearla igualmente?'),
    ).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.press(screen.getByRole('button', { name: 'Crear' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('goes back to the form without creating when the past date is not confirmed', () => {
    const { onSubmit } = renderForm({
      initialValues: {
        ...EMPTY_TASK_FORM_VALUES,
        name: 'Pagar el recibo',
        dueDate: '2026-10-01',
      },
    });

    fireEvent.press(screen.getByRole('button', { name: 'Crear tarea' }));
    fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.queryByText(/nacerá vencida/)).toBeNull();
    expect(screen.getByLabelText('Nombre').props.value).toBe('Pagar el recibo');
  });

  it('does not warn when editing a task that keeps its already past date', () => {
    const { onSubmit } = renderForm({
      mode: 'edit',
      initialValues: {
        ...EMPTY_TASK_FORM_VALUES,
        name: 'Vencida',
        dueDate: '2026-10-01',
      },
    });

    fireEvent.press(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('warns when editing moves the date to the past', () => {
    const { onSubmit } = renderForm({
      mode: 'edit',
      initialValues: {
        ...EMPTY_TASK_FORM_VALUES,
        name: 'Al día',
        dueDate: '2026-10-20',
      },
    });

    fireEvent.press(screen.getByRole('button', { name: 'Fecha' }));
    const pickerOptions = jest.mocked(DateTimePickerAndroid.open).mock
      .calls[0][0];
    const pastDay = new Date(2026, 9, 1, 12);
    act(() => {
      pickerOptions.onChange?.(
        { type: 'set', nativeEvent: { timestamp: pastDay.getTime() } } as never,
        pastDay,
      );
    });
    fireEvent.press(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(
      screen.getByText('Esta tarea quedará vencida. ¿Guardarla igualmente?'),
    ).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps what was written and shows the message when saving failed', () => {
    renderForm({ saveError: 'No hay conexión. Inténtalo de nuevo.' });

    expect(
      screen.getByText('No hay conexión. Inténtalo de nuevo.'),
    ).toBeTruthy();
  });

  it('shows the archive button only when editing and asks before archiving', () => {
    const onArchive = jest.fn();
    renderForm({ mode: 'edit', onArchive });

    fireEvent.press(screen.getByRole('button', { name: 'Archivar tarea' }));
    expect(
      screen.getByText('Dejará de aparecer, pero su historial se conserva.'),
    ).toBeTruthy();
    expect(onArchive).not.toHaveBeenCalled();
    fireEvent.press(screen.getByRole('button', { name: 'Archivar' }));
    expect(onArchive).toHaveBeenCalledTimes(1);
  });

  it('has no archive button when creating', () => {
    renderForm();

    expect(screen.queryByText('Archivar tarea')).toBeNull();
  });
});

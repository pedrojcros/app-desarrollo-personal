import { expect, it, jest } from '@jest/globals';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { ThemeScope } from '@/theme/theme-scope';
import { HabitForm } from './habit-form';

jest.mock('@/data/supabase/client', () => ({ supabase: {} }));
jest.mock('@/components/category-select', () => ({
  CategorySelect: () => null,
}));
jest.mock('@/data/use-today', () => ({ useToday: () => '2026-10-07' }));
jest.mock('@/components/date-field', () => {
  const { TextInput } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return {
    DateField: ({
      label,
      value,
      onChange,
    }: {
      label: string;
      value: string;
      onChange: (value: string) => void;
    }) => (
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
      />
    ),
    TimeField: ({
      label,
      value,
      onChange,
    }: {
      label: string;
      value: string;
      onChange: (value: string) => void;
    }) => (
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
      />
    ),
  };
});

function renderForm(
  onSubmit = jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
) {
  render(
    <ThemeScope themeName="white">
      <HabitForm mode="create" onSubmit={onSubmit} />
    </ThemeScope>,
  );
  return onSubmit;
}

it('creates a daily night habit with today as its start date', async () => {
  const onSubmit = renderForm();
  fireEvent.changeText(screen.getByLabelText('Nombre'), '  Dientes  ');
  fireEvent.press(screen.getByRole('radio', { name: 'Noche' }));
  fireEvent.press(screen.getByRole('button', { name: 'Crear hábito' }));
  await waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Dientes',
        startDate: '2026-10-07',
        frequency: 'daily',
        timeSlot: 'night',
        timeOfDay: null,
      }),
    ),
  );
});

it('shows a required name error without submitting', async () => {
  const onSubmit = renderForm();
  fireEvent.press(screen.getByRole('button', { name: 'Crear hábito' }));
  expect(
    await screen.findByText('Escribe un nombre de 1 a 80 caracteres.'),
  ).toBeTruthy();
  expect(onSubmit).not.toHaveBeenCalled();
});

it('rejects no selected weekday and preserves the draft', async () => {
  const onSubmit = renderForm();
  fireEvent.changeText(screen.getByLabelText('Nombre'), 'Nadar');
  fireEvent.press(screen.getByRole('radio', { name: 'Días de la semana' }));
  fireEvent.press(screen.getByRole('button', { name: 'Crear hábito' }));
  expect(await screen.findByText('Elige al menos un día.')).toBeTruthy();
  expect(screen.getByLabelText('Nombre')).toHaveDisplayValue('Nadar');
  expect(onSubmit).not.toHaveBeenCalled();
});

it.each(['0', '366', '1.5', 'texto'])(
  'rejects invalid interval %s',
  async (interval) => {
    const onSubmit = renderForm();
    fireEvent.changeText(screen.getByLabelText('Nombre'), 'Leer');
    fireEvent.press(screen.getByRole('radio', { name: 'Cada N días' }));
    fireEvent.changeText(screen.getByLabelText('Cada cuántos días'), interval);
    fireEvent.press(screen.getByRole('button', { name: 'Crear hábito' }));
    expect(
      await screen.findByText('Escribe un número entero de 1 a 365.'),
    ).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  },
);

it('choosing a slot removes the exact time and choosing exact time removes the slot', async () => {
  const onSubmit = renderForm();
  fireEvent.changeText(screen.getByLabelText('Nombre'), 'Leer');
  fireEvent.press(screen.getByRole('radio', { name: 'Hora exacta' }));
  fireEvent.changeText(screen.getByLabelText('Hora'), '17:00');
  fireEvent.press(screen.getByRole('radio', { name: 'Mañana' }));
  expect(screen.queryByLabelText('Hora')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Crear hábito' }));
  await waitFor(() =>
    expect(onSubmit).toHaveBeenLastCalledWith(
      expect.objectContaining({ timeSlot: 'morning', timeOfDay: null }),
    ),
  );
  fireEvent.press(screen.getByRole('radio', { name: 'Hora exacta' }));
  fireEvent.changeText(screen.getByLabelText('Hora'), '18:00');
  fireEvent.press(screen.getByRole('button', { name: 'Crear hábito' }));
  await waitFor(() =>
    expect(onSubmit).toHaveBeenLastCalledWith(
      expect.objectContaining({ timeSlot: null, timeOfDay: '18:00' }),
    ),
  );
});

it('retains all written values after a failed save and permits retry', async () => {
  const onSubmit = jest
    .fn<() => Promise<void>>()
    .mockRejectedValueOnce(new Error('Network failure'))
    .mockResolvedValueOnce(undefined);
  renderForm(onSubmit);
  fireEvent.changeText(screen.getByLabelText('Nombre'), 'Mi hábito');
  fireEvent.press(screen.getByRole('button', { name: 'Crear hábito' }));
  expect(
    await screen.findByText(
      'No se pudo guardar. Tus cambios siguen aquí; inténtalo de nuevo.',
    ),
  ).toBeTruthy();
  expect(screen.getByLabelText('Nombre')).toHaveDisplayValue('Mi hábito');
  fireEvent.press(screen.getByRole('button', { name: 'Crear hábito' }));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
});

it('locks an already started date and explains why', () => {
  render(
    <ThemeScope themeName="white">
      <HabitForm
        mode="edit"
        initialValue={{ startDate: '2026-10-06', name: 'Leer' }}
        onSubmit={jest.fn<() => Promise<void>>()}
      />
    </ThemeScope>,
  );
  expect(screen.queryByLabelText('Fecha de inicio')).toBeNull();
  expect(
    screen.getByText('Ya ha empezado: cambiarla reescribiría el pasado'),
  ).toBeTruthy();
});

it('rejects a past start date when creating without submitting', async () => {
  const onSubmit = renderForm();
  fireEvent.changeText(screen.getByLabelText('Nombre'), 'Leer');
  fireEvent.changeText(screen.getByLabelText('Fecha de inicio'), '2026-10-06');
  fireEvent.press(screen.getByRole('button', { name: 'Crear hábito' }));
  expect(
    await screen.findByText('Elige una fecha de hoy en adelante.'),
  ).toBeTruthy();
  expect(onSubmit).not.toHaveBeenCalled();
});

it.each([
  {
    frequency: 'monthly' as const,
    explanation:
      'Se repite el día del mes de hoy, que es cuando empieza el cambio',
  },
  { frequency: 'every_n_days' as const, explanation: 'Cuenta desde hoy' },
])(
  'explains the new anchor for $frequency when editing a started habit',
  ({ frequency, explanation }) => {
    render(
      <ThemeScope themeName="white">
        <HabitForm
          mode="edit"
          initialValue={{ startDate: '2026-10-01', frequency, intervalDays: 3 }}
          onSubmit={jest.fn<() => Promise<void>>()}
        />
      </ThemeScope>,
    );
    expect(screen.getByText(new RegExp(explanation))).toBeTruthy();
  },
);

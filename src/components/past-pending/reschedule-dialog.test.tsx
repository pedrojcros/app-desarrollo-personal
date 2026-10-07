import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeScope } from '@/theme/theme-scope';

import { RescheduleDialog } from './reschedule-dialog';

jest.mock('@react-native-community/datetimepicker', () => ({
  DateTimePickerAndroid: { open: jest.fn() },
}));

const today = '2026-10-07';
const onSave = jest.fn();
const onCancel = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

function renderDialog(errorMessage?: string) {
  return render(
    <ThemeScope themeName="white">
      <RescheduleDialog
        taskName="Factura"
        today={today}
        errorMessage={errorMessage}
        onSave={onSave}
        onCancel={onCancel}
      />
    </ThemeScope>,
  );
}

// Simula que la persona elige un día en el selector nativo, que no impone el mínimo.
function pickDate(year: number, monthIndex: number, day: number) {
  fireEvent.press(screen.getByRole('button', { name: 'Nueva fecha' }));
  const options = jest.mocked(DateTimePickerAndroid.open).mock.calls[0][0];
  const selected = new Date(year, monthIndex, day, 12);
  act(() => {
    options.onChange?.(
      {
        type: 'set',
        nativeEvent: { timestamp: selected.getTime(), utcOffset: 0 },
      },
      selected,
    );
  });
}

describe('RescheduleDialog', () => {
  it('names the task and starts on tomorrow', () => {
    renderDialog();
    expect(screen.getByLabelText('Reprogramar Factura')).toBeTruthy();
    expect(screen.getByText('jueves, 8 de octubre de 2026')).toBeTruthy();
  });

  it('saves the date chosen with the Today shortcut', () => {
    renderDialog();
    fireEvent.press(screen.getByRole('button', { name: 'Hoy' }));
    fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(onSave).toHaveBeenCalledWith('2026-10-07');
  });

  it('saves the date chosen with the Tomorrow shortcut', () => {
    renderDialog();
    fireEvent.press(screen.getByRole('button', { name: 'Hoy' }));
    fireEvent.press(screen.getByRole('button', { name: 'Mañana' }));
    fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(onSave).toHaveBeenCalledWith('2026-10-08');
  });

  it('saves a date picked in the calendar', () => {
    renderDialog();
    pickDate(2026, 9, 20);
    fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(onSave).toHaveBeenCalledWith('2026-10-20');
  });

  it('refuses a date before today and does not save (CU-04, E1)', () => {
    renderDialog();
    pickDate(2026, 9, 5);
    fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(
      screen.getByText('La nueva fecha debe ser hoy o posterior.'),
    ).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('clears the date error when a valid date is chosen', () => {
    renderDialog();
    pickDate(2026, 9, 5);
    fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    fireEvent.press(screen.getByRole('button', { name: 'Mañana' }));
    expect(
      screen.queryByText('La nueva fecha debe ser hoy o posterior.'),
    ).toBeNull();
  });

  it('shows a save error coming from outside', () => {
    renderDialog('No se ha podido reprogramar. Inténtalo de nuevo.');
    expect(
      screen.getByText('No se ha podido reprogramar. Inténtalo de nuevo.'),
    ).toBeTruthy();
  });

  it('cancels', () => {
    renderDialog();
    fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalled();
  });
});

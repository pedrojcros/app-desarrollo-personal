import { expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { DateField, TimeField } from './index';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { ThemeScope } from '@/theme/theme-scope';

jest.mock('@react-native-community/datetimepicker', () => ({
  DateTimePickerAndroid: { open: jest.fn() },
}));
it('shows a Spanish calendar date and sends the selected day without UTC conversion', () => {
  const onChange = jest.fn();
  render(
    <ThemeScope themeName="white">
      <DateField
        label="Inicio"
        value="2026-10-06"
        onChange={onChange}
        minimumDate="2026-01-01"
        maximumDate="2026-10-07"
      />
    </ThemeScope>,
  );
  expect(screen.getByText('martes, 6 de octubre de 2026')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Inicio' }));
  const options = jest.mocked(DateTimePickerAndroid.open).mock.calls[0][0];
  expect(options.mode).toBe('date');
  expect(options.maximumDate?.getDate()).toBe(7);
  const selected = new Date(2026, 9, 5, 12);
  options.onChange?.(
    {
      type: 'set',
      nativeEvent: { timestamp: selected.getTime(), utcOffset: 120 },
    },
    selected,
  );
  expect(onChange).toHaveBeenCalledWith('2026-10-05');
});
it('sends an HH:MM time and ignores dismissal', () => {
  jest.mocked(DateTimePickerAndroid.open).mockClear();
  const onChange = jest.fn();
  render(
    <ThemeScope themeName="white">
      <TimeField label="Hora" value="08:30" onChange={onChange} />
    </ThemeScope>,
  );
  fireEvent.press(screen.getByRole('button', { name: 'Hora' }));
  const options = jest.mocked(DateTimePickerAndroid.open).mock.calls[0][0];
  const selected = new Date(2026, 9, 5, 9, 45);
  options.onChange?.(
    { type: 'dismissed', nativeEvent: { timestamp: 0, utcOffset: 0 } },
    selected,
  );
  expect(onChange).not.toHaveBeenCalled();
  options.onChange?.(
    {
      type: 'set',
      nativeEvent: { timestamp: selected.getTime(), utcOffset: 120 },
    },
    selected,
  );
  expect(onChange).toHaveBeenCalledWith('09:45');
});

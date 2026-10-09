import { expect, it, jest } from '@jest/globals';
import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeScope } from '@/theme/theme-scope';
import { UpwardChoice } from './upward-choice';

const choices = [
  { value: 'daily', label: 'Todos los días' },
  { value: 'weekly', label: 'Días de la semana' },
];

function renderChoice(disabled = false) {
  const onChange = jest.fn();
  function ChoiceExample() {
    const [value, setValue] = useState('daily');
    return (
      <ThemeScope themeName="white">
        <UpwardChoice
          label="Frecuencia"
          value={value}
          choices={choices}
          disabled={disabled}
          onChange={(nextValue) => {
            setValue(nextValue);
            onChange(nextValue);
          }}
        />
      </ThemeScope>
    );
  }
  render(<ChoiceExample />);
  return onChange;
}

it('exposes each option with its label, radio role and checked state', () => {
  renderChoice();
  fireEvent.press(screen.getByRole('button', { name: 'Frecuencia' }));
  const dailyOption = screen.getByRole('radio', { name: 'Todos los días' });
  const weeklyOption = screen.getByRole('radio', { name: 'Días de la semana' });
  expect(dailyOption).toHaveProp('accessibilityLabel', 'Todos los días');
  expect(weeklyOption).toHaveProp('accessibilityLabel', 'Días de la semana');
  expect(dailyOption).toBeChecked();
  expect(weeklyOption).not.toBeChecked();
});

it('selects an option, closes the menu and exposes the updated state', () => {
  const onChange = renderChoice();
  fireEvent.press(screen.getByRole('button', { name: 'Frecuencia' }));
  fireEvent.press(screen.getByRole('radio', { name: 'Días de la semana' }));
  expect(onChange).toHaveBeenCalledWith('weekly');
  expect(screen.queryByRole('radio')).toBeNull();
  expect(
    screen.getByRole('button', { name: 'Frecuencia', expanded: false }),
  ).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Frecuencia' }));
  expect(
    screen.getByRole('radio', { name: 'Días de la semana' }),
  ).toBeChecked();
});

it('keeps a disabled selector closed', () => {
  renderChoice(true);
  fireEvent.press(screen.getByRole('button', { name: 'Frecuencia' }));
  expect(screen.queryByRole('radio')).toBeNull();
});

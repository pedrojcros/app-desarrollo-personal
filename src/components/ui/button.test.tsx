import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from './button';
import { Text } from './text';

describe('Button', () => {
  it('exposes its label and calls the press handler', () => {
    const handlePress = jest.fn();
    render(
      <Button onPress={handlePress} accessibilityLabel="Continuar">
        <Text>Continuar</Text>
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Continuar' });
    fireEvent.press(button);

    expect(screen.getByText('Continuar')).toBeTruthy();
    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it('does not call the press handler when disabled', () => {
    const handlePress = jest.fn();
    render(
      <Button disabled onPress={handlePress} accessibilityLabel="Continuar">
        <Text>Continuar</Text>
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Continuar' });
    fireEvent.press(button);

    expect(button).toBeDisabled();
    expect(handlePress).not.toHaveBeenCalled();
  });
});

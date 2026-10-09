import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeScope } from '@/theme/theme-scope';

import { ConfirmDialog } from './confirm-dialog';

function renderInTheme(element: ReactElement) {
  return render(
    <ThemeScope themeName="white" preference="white">
      {element}
    </ThemeScope>,
  );
}

function renderDialog(overrides: Partial<Parameters<typeof ConfirmDialog>[0]>) {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  renderInTheme(
    <ConfirmDialog
      visible
      title="Eliminar «Compra»"
      message="Se moverán a la Bandeja 2 hábitos y 3 tareas."
      confirmLabel="Eliminar"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}
    />,
  );
  return { onConfirm, onCancel };
}

describe('ConfirmDialog', () => {
  it('shows the title, the message and both actions', () => {
    renderDialog({});

    expect(screen.getByLabelText('Eliminar «Compra»')).toBeTruthy();
    expect(screen.getByText('Eliminar «Compra»')).toBeTruthy();
    expect(
      screen.getByText('Se moverán a la Bandeja 2 hábitos y 3 tareas.'),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeTruthy();
  });

  it('confirms and cancels with their own buttons', () => {
    const { onConfirm, onCancel } = renderDialog({});

    fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.press(screen.getByRole('button', { name: 'Eliminar' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('uses a custom cancel label', () => {
    renderDialog({ cancelLabel: 'Mejor no' });

    expect(screen.getByRole('button', { name: 'Mejor no' })).toBeTruthy();
  });

  it('renders nothing while it is not visible', () => {
    renderDialog({ visible: false });

    expect(screen.queryByLabelText('Eliminar «Compra»')).toBeNull();
  });
});

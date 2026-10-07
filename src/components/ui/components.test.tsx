import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Sun } from 'lucide-react-native';

import { ThemeScope } from '@/theme/theme-scope';
import type { ThemeName, ThemePreference } from '@/theme/tokens';

import { ListRow } from './list-row';
import { TabIcon } from './tab-icon';
import { TextField } from './text-field';
import { ThemeSelector } from './theme-selector';
import { UndoNotice } from './undo-notice';

function renderInTheme(
  element: React.ReactElement,
  themeName: ThemeName = 'white',
  setPreference?: (preference: ThemePreference) => void,
) {
  return render(
    <ThemeScope
      themeName={themeName}
      preference={themeName}
      setPreference={setPreference}
    >
      {element}
    </ThemeScope>,
  );
}

describe('ListRow', () => {
  it('marks done and not done with their own buttons', () => {
    const handleDone = jest.fn();
    const handleNotDone = jest.fn();
    renderInTheme(
      <ListRow
        title="Leer 20 minutos"
        meta="Personal · Hábito"
        category="amber"
        onMarkDone={handleDone}
        onMarkNotDone={handleNotDone}
      />,
    );

    fireEvent.press(screen.getByLabelText('Marcar Leer 20 minutos como hecho'));
    fireEvent.press(
      screen.getByLabelText('Marcar Leer 20 minutos como no hecho'),
    );

    expect(handleDone).toHaveBeenCalledTimes(1);
    expect(handleNotDone).toHaveBeenCalledTimes(1);
  });

  it('works without a category, as the inbox rows do', () => {
    const handleDone = jest.fn();
    renderInTheme(
      <ListRow
        title="Pedir cita en el banco"
        meta="Tarea"
        onMarkDone={handleDone}
        onMarkNotDone={jest.fn()}
      />,
    );

    fireEvent.press(
      screen.getByLabelText('Marcar Pedir cita en el banco como hecho'),
    );

    expect(handleDone).toHaveBeenCalledTimes(1);
  });

  it('does not mark anything when disabled', () => {
    const handleDone = jest.fn();
    renderInTheme(
      <ListRow
        title="Leer 20 minutos"
        meta="Personal · Hábito"
        category="amber"
        disabled
        onMarkDone={handleDone}
        onMarkNotDone={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByLabelText('Marcar Leer 20 minutos como hecho'));

    expect(handleDone).not.toHaveBeenCalled();
  });
});

describe('UndoNotice', () => {
  it('shows the message and calls the action', () => {
    const handleUndo = jest.fn();
    renderInTheme(
      <UndoNotice message="Marcada como hecha" onAction={handleUndo} />,
    );

    fireEvent.press(screen.getByText('Deshacer'));

    expect(screen.getByText('Marcada como hecha')).toBeTruthy();
    expect(handleUndo).toHaveBeenCalledTimes(1);
  });
});

describe('TabIcon', () => {
  it('shows the counter only when there is something pending', () => {
    renderInTheme(<TabIcon icon={Sun} focused={false} badgeCount={2} />);
    expect(screen.getByText('2')).toBeTruthy();

    screen.unmount();
    renderInTheme(<TabIcon icon={Sun} focused={false} badgeCount={0} />);
    expect(screen.queryByText('0')).toBeNull();
  });
});

describe('TextField', () => {
  it('shows the error message', () => {
    renderInTheme(<TextField label="Nombre" error="Escribe un nombre" />);

    expect(screen.getByText('Escribe un nombre')).toBeTruthy();
  });
});

describe('ThemeSelector', () => {
  it('marks the current theme and changes it when another is chosen', () => {
    const handleChange = jest.fn();
    renderInTheme(<ThemeSelector />, 'black', handleChange);

    const blackOption = screen.getByRole('radio', { name: /Negro/ });
    expect(blackOption).toBeChecked();
    const whiteOption = screen.getByRole('radio', { name: /Blanco/ });
    expect(whiteOption).not.toBeChecked();

    fireEvent.press(screen.getByRole('radio', { name: /Tercer estilo/ }));
    fireEvent.press(screen.getByRole('radio', { name: /Automático/ }));

    expect(handleChange).toHaveBeenNthCalledWith(1, 'bold');
    expect(handleChange).toHaveBeenNthCalledWith(2, 'automatic');
  });
});

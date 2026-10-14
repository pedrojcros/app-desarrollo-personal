import { expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeScope } from '@/theme/theme-scope';
import { ListRow } from './list-row';

it('keeps both mark actions in the default variant', () => {
  const markDone = jest.fn();
  const markNotDone = jest.fn();
  render(
    <ThemeScope themeName="white">
      <ListRow
        title="Nadar"
        meta="17:00"
        onMarkDone={markDone}
        onMarkNotDone={markNotDone}
      />
    </ThemeScope>,
  );
  fireEvent.press(
    screen.getByRole('button', { name: 'Marcar Nadar como hecho' }),
  );
  fireEvent.press(
    screen.getByRole('button', { name: 'Marcar Nadar como no hecho' }),
  );
  expect(markDone).toHaveBeenCalledTimes(1);
  expect(markNotDone).toHaveBeenCalledTimes(1);
});
it('renders a read-only row without mark callbacks or buttons', () => {
  const open = jest.fn();
  render(
    <ThemeScope themeName="white">
      <ListRow
        readOnly
        title="Nadar"
        meta="17:00"
        onPress={open}
        accessibilityLabel="Nadar, Miércoles 21, abre la ficha"
      />
    </ThemeScope>,
  );
  expect(screen.getAllByRole('button')).toHaveLength(1);
  fireEvent.press(screen.getByLabelText('Nadar, Miércoles 21, abre la ficha'));
  expect(open).toHaveBeenCalledTimes(1);
});

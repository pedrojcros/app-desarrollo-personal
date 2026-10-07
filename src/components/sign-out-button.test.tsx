import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

import { signOut } from '@/data/auth';
import { renderWithTheme } from '@/tests/render-with-theme';

import { SignOutButton } from './sign-out-button';

jest.mock('@/data/auth', () => ({ signOut: jest.fn() }));

const signOutMock = jest.mocked(signOut);

function renderButton() {
  renderWithTheme(<SignOutButton />);
}

describe('SignOutButton', () => {
  beforeEach(() => {
    signOutMock.mockReset();
  });

  it('signs out when pressed', async () => {
    signOutMock.mockResolvedValue({ ok: true, value: null });
    renderButton();

    fireEvent.press(screen.getByLabelText('Cerrar sesión'));

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(await screen.findByLabelText('Cerrar sesión')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows a friendly message when signing out fails', async () => {
    signOutMock.mockResolvedValue({
      ok: false,
      error: { code: 'unknown_error', message: 'JWT expired (technical)' },
    });
    renderButton();

    fireEvent.press(screen.getByLabelText('Cerrar sesión'));

    const message = await screen.findByText(
      'No se ha podido cerrar la sesión. Inténtalo de nuevo',
    );
    expect(message).toBeTruthy();
    expect(screen.queryByText(/JWT/)).toBeNull();
  });
});

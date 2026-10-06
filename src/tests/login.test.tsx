import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import { signInWithPassword } from '@/data/auth';

import LoginScreen from '../app/login';

jest.mock('@/data/auth', () => ({ signInWithPassword: jest.fn() }));

const fakePassword = 'x'.repeat(12);
const wrongFakePassword = 'y'.repeat(12);

const signInWithPasswordMock = jest.mocked(signInWithPassword);

function fillAndSubmit(email: string, password: string) {
  fireEvent.changeText(screen.getByLabelText('Email'), email);
  fireEvent.changeText(screen.getByLabelText('Contraseña'), password);
  fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
}

describe('LoginScreen', () => {
  beforeEach(() => {
    signInWithPasswordMock.mockReset();
  });

  it('signs in with the typed email and password', async () => {
    signInWithPasswordMock.mockResolvedValue({ ok: true, value: null });
    render(<LoginScreen />);

    fillAndSubmit('owner@example.com', fakePassword);

    await waitFor(() => {
      expect(signInWithPasswordMock).toHaveBeenCalledWith(
        'owner@example.com',
        fakePassword,
      );
    });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows a Spanish message when the credentials are wrong', async () => {
    signInWithPasswordMock.mockResolvedValue({
      ok: false,
      error: { code: 'invalid_credentials', message: 'Technical detail' },
    });
    render(<LoginScreen />);

    fillAndSubmit('owner@example.com', wrongFakePassword);

    expect(
      await screen.findByText('Email o contraseña incorrectos'),
    ).toBeTruthy();
    expect(screen.queryByText('Technical detail')).toBeNull();
  });

  it('shows a Spanish message when the server cannot be reached', async () => {
    signInWithPasswordMock.mockResolvedValue({
      ok: false,
      error: { code: 'network_error', message: 'Technical detail' },
    });
    render(<LoginScreen />);

    fillAndSubmit('owner@example.com', fakePassword);

    expect(
      await screen.findByText('No se ha podido conectar. Inténtalo de nuevo'),
    ).toBeTruthy();
  });
});

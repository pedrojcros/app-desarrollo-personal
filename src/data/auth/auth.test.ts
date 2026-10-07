import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js';

import { supabase } from '../supabase/client';

import { signInWithPassword, signOut } from './auth';

jest.mock('../supabase/client', () => ({
  supabase: {
    auth: { signInWithPassword: jest.fn(), signOut: jest.fn() },
  },
}));

const fakePassword = 'x'.repeat(12);
const wrongFakePassword = 'y'.repeat(12);

const signInMock = jest.mocked(supabase.auth.signInWithPassword);
const signOutMock = jest.mocked(supabase.auth.signOut);

describe('signInWithPassword', () => {
  beforeEach(() => {
    signInMock.mockReset();
  });

  it('rejects a malformed email without calling Supabase', async () => {
    const result = await signInWithPassword('not-an-email', fakePassword);

    expect(result).toEqual({
      ok: false,
      error: { code: 'invalid_input', message: expect.any(String) },
    });
    expect(signInMock).not.toHaveBeenCalled();
  });

  it('rejects an empty password without calling Supabase', async () => {
    const result = await signInWithPassword('owner@example.com', '');

    expect(result.ok).toBe(false);
    expect(signInMock).not.toHaveBeenCalled();
  });

  it('trims the email before signing in', async () => {
    signInMock.mockResolvedValue({ data: {}, error: null } as never);

    const result = await signInWithPassword(
      ' owner@example.com ',
      fakePassword,
    );

    expect(result).toEqual({ ok: true, value: null });
    expect(signInMock).toHaveBeenCalledWith({
      email: 'owner@example.com',
      password: fakePassword,
    });
  });

  it('reports wrong credentials with their own code', async () => {
    const error = new AuthApiError(
      'Invalid login credentials',
      400,
      'invalid_credentials',
    );
    signInMock.mockResolvedValue({ data: {}, error } as never);

    const result = await signInWithPassword(
      'owner@example.com',
      wrongFakePassword,
    );

    expect(result).toMatchObject({
      ok: false,
      error: { code: 'invalid_credentials' },
    });
  });

  it('reports a network failure with its own code', async () => {
    const error = new AuthRetryableFetchError('Failed to fetch', 0);
    signInMock.mockResolvedValue({ data: {}, error } as never);

    const result = await signInWithPassword('owner@example.com', fakePassword);

    expect(result).toMatchObject({
      ok: false,
      error: { code: 'network_error' },
    });
  });

  it('reports any other failure as unknown_error', async () => {
    signInMock.mockRejectedValue(new Error('boom'));

    const result = await signInWithPassword('owner@example.com', fakePassword);

    expect(result).toMatchObject({
      ok: false,
      error: { code: 'unknown_error' },
    });
  });
});

describe('signOut', () => {
  it('succeeds when Supabase signs out', async () => {
    signOutMock.mockResolvedValue({ error: null });

    expect(await signOut()).toEqual({ ok: true, value: null });
  });
});

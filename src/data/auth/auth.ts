import { AuthRetryableFetchError, isAuthError } from '@supabase/supabase-js';
import { z } from 'zod';

import { fail, succeed, type DataResult } from '../result';
import { cancelReminderSync } from '../reminders';
import { supabase } from '../supabase/client';

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type AuthErrorCode =
  'invalid_input' | 'invalid_credentials' | 'network_error' | 'unknown_error';

function describeFailure(error: unknown): DataResult<never> {
  if (error instanceof AuthRetryableFetchError) {
    return fail('network_error', 'Could not reach the authentication server');
  }

  if (isAuthError(error) && error.code === 'invalid_credentials') {
    return fail('invalid_credentials', 'Email or password is incorrect');
  }

  return fail('unknown_error', 'Authentication failed');
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<DataResult<null>> {
  const parsedCredentials = credentialsSchema.safeParse({
    email: email.trim(),
    password,
  });
  if (!parsedCredentials.success) {
    return fail('invalid_input', 'Email or password has an invalid format');
  }

  try {
    const response = await supabase.auth.signInWithPassword(
      parsedCredentials.data,
    );
    if (response.error) {
      return describeFailure(response.error);
    }
    return succeed(null);
  } catch (error) {
    return describeFailure(error);
  }
}

export async function signOut(): Promise<DataResult<null>> {
  try {
    const response = await supabase.auth.signOut();
    if (response.error) {
      return describeFailure(response.error);
    }
    await cancelReminderSync();
    return succeed(null);
  } catch (error) {
    return describeFailure(error);
  }
}

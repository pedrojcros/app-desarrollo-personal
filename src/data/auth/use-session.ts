import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

import { supabase } from '../supabase/client';

type SessionState = {
  session: Session | null;
  isLoading: boolean;
};

// Supabase avisa con INITIAL_SESSION cuando ha leído la sesión guardada en el
// dispositivo; hasta entonces no se sabe si hay sesión.
export function useSession(): SessionState {
  const [sessionState, setSessionState] = useState<SessionState>({
    session: null,
    isLoading: true,
  });

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionState({ session, isLoading: false });
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return sessionState;
}

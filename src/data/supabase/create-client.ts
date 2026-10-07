import {
  createClient,
  type SupabaseClient,
  type SupportedStorage,
} from '@supabase/supabase-js';

import type { Database } from '../database.types';

export type AppSupabaseClient = SupabaseClient<Database>;

type CreateClientOptions = {
  url: string;
  anonKey: string;
  // Dónde se guarda la sesión. Sin almacenamiento (renderizado de la web en el
  // servidor) la sesión solo vive en memoria.
  storage?: SupportedStorage;
  autoRefreshToken?: boolean;
};

// Solo recibe la clave pública (anon): la clave service_role nunca entra en la app.
export function createAppSupabaseClient(
  options: CreateClientOptions,
): AppSupabaseClient {
  const hasStorage = options.storage !== undefined;
  const autoRefreshToken = options.autoRefreshToken ?? hasStorage;

  return createClient<Database>(options.url, options.anonKey, {
    auth: {
      storage: options.storage,
      persistSession: hasStorage,
      autoRefreshToken,
      // En el móvil no hay URL de retorno; en la web, la v1 no usa enlaces mágicos.
      detectSessionInUrl: false,
    },
  });
}

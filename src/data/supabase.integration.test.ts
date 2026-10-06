import { describe, expect, it } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

describe('Local Supabase', () => {
  it('responds with authentication settings and signup disabled', async () => {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Local Supabase environment variables are required');
    }

    const parsedUrl = new URL(supabaseUrl);
    const localHosts = ['localhost', '127.0.0.1', '[::1]'];
    if (!localHosts.includes(parsedUrl.hostname)) {
      throw new Error('Integration tests require a local Supabase instance');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const sessionResult = await supabase.auth.getSession();
    expect(sessionResult.error).toBeNull();

    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: supabaseAnonKey },
    });
    expect(response.status).toBe(200);

    const settings = await response.json();
    expect(settings.disable_signup).toBe(true);
  });
});

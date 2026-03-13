import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _adminClient: SupabaseClient | null = null;

export const adminClient: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_adminClient) {
      _adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
    }
    return (_adminClient as unknown as Record<string | symbol, unknown>)[prop];
  },
});

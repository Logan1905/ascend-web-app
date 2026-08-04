import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for use in the browser (Client Components).
 *
 * Reads configuration from the public environment variables. These are safe to
 * expose to the browser because they only grant the permissions defined by your
 * Supabase Row Level Security policies.
 *
 * NOTE: This should only be called in the browser (inside useEffect or event
 * handlers), never during SSR/static prerendering.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

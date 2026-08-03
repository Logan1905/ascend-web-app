import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for use on the server (Server Components, Route
 * Handlers, and Server Actions) in the Next.js App Router.
 *
 * In Next.js 16, `cookies()` is asynchronous, so this helper is async. The
 * cookie handlers keep the user's auth session in sync between the browser and
 * the server once authentication is added later.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The `setAll` method was called from a Server Component. This can
            // be safely ignored when session refreshing is handled elsewhere
            // (for example, in a proxy) once authentication is implemented.
          }
        },
      },
    },
  );
}

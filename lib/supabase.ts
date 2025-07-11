import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookies().get(name)?.value;
        },
        set() {
          // noop for App Router – cookies can't be set from server components
        },
        remove() {
          // noop for App Router – cookies can't be removed from server components
        },
      },
    }
  );
}

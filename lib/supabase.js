import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Fail clearly when the public Supabase environment variables are missing.
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before running or building the app."
  );
}

// Shared browser client used by the pages that import { supabase }.
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createBrowserClient(supabaseUrl, supabaseAnonKey)
    : null;

// Factory retained for pages/components that import { supabaseBrowser }.
export function supabaseBrowser() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in the environment."
    );
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

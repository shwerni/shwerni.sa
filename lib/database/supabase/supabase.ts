// pacakge
import { createBrowserClient } from "@supabase/ssr";

// supabase client config
export const supabaseDB = () =>
  createBrowserClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_ANON_KEY as string
  );

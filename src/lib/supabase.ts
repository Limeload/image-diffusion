import { createClient } from "@supabase/supabase-js";

// Service-role client for all server-side operations (bypasses RLS)
export function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

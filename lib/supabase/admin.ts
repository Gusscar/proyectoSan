import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente con la Service Role Key: bypasa RLS por completo.
// SOLO debe usarse en Route Handlers / Server Actions de confianza
// (creación de usuarios, lectura de credenciales temporales por el admin).
// `import "server-only"` hace que el build falle si este módulo termina
// importado desde un Client Component.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

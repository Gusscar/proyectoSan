import { createBrowserClient } from "@supabase/ssr";

// Sin el generic `Database`: requeriría declarar `Relationships` por tabla
// (metadata que normalmente genera `supabase gen types typescript` contra
// un proyecto real). Las formas de cada fila viven en ./types y se aplican
// en el punto de uso con `.returns<T>()`.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

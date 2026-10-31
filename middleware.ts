import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Cualquier .js/.js.map en la raíz es un asset del service worker
    // (sw.js, workbox-*.js, swe-worker-*.js, worker-*.js, ...) — nunca una
    // ruta de la app. Excluirlos todos de una vez evita repetir este bug
    // cada vez que next-pwa cambia el nombre de un archivo que genera.
    "/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|icons/|.*\\.js(?:\\.map)?$).*)",
  ],
};

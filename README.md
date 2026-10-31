# SanApp

PWA para llevar el control transparente de un San / tanda (ahorro
colaborativo rotativo). Construida con Next.js 15 (App Router), TypeScript,
Tailwind CSS v4 y Supabase (Auth + Postgres).

## Stack y decisiones clave

- **Next.js 15** (no 16): `@ducanh2912/next-pwa` genera el service worker
  vía Workbox sobre **Webpack**, y Next.js 16 usa Turbopack por defecto en
  `next build` (falla si detecta una config de Webpack salvo que se use
  `--webpack`). Next 15 sigue usando Webpack por defecto, así que el plugin
  funciona tal cual. Si en el futuro se migra a Next 16, cambiar a
  [`@serwist/next`](https://serwist.pages.dev/docs/next) (sucesor oficial,
  compatible con Turbopack) en vez de forzar `--webpack`.
- **Tailwind v4** (CSS-first, sin `tailwind.config.js`): paleta `slate-950`
  / `emerald-500` / `indigo-500` definida directamente en clases utilitarias.
- **Contraseñas temporales aleatorias**, no el patrón `San2026#Nombre` del
  prompt original (adivinable sabiendo el nombre del participante). Se
  generan con `crypto.getRandomValues` y se muestran una sola vez al admin
  además de quedar guardadas en `member_credentials` para consulta
  posterior en `/admin/users`.

## Puesta en marcha

### 1. Crear el proyecto en Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor** y ejecuta el contenido de [`supabase/schema.sql`](./supabase/schema.sql)
   completo, una sola vez.
3. En **Project Settings > API** copia la `Project URL`, la `anon public key`
   y la `service_role key`.

### 2. Variables de entorno

```bash
cp .env.local.example .env.local
```

Completa `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y
`SUPABASE_SERVICE_ROLE_KEY` con los valores del paso anterior.
`SUPABASE_SERVICE_ROLE_KEY` **nunca** debe exponerse al cliente ni
commitearse: solo se usa en `app/api/admin/create-user/route.ts` y
`lib/supabase/admin.ts`.

### 3. Instalar y correr

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### 4. Crear el primer administrador

No existe auto-registro (por diseño: solo el admin da de alta participantes).
Para el primer admin:

1. En Supabase Studio: **Authentication > Add user**, crea el usuario con
   correo y contraseña.
2. En **SQL Editor**, promuévelo a admin:

   ```sql
   update public.profiles set role = 'admin' where id = '<uuid-del-usuario>';
   ```

3. Inicia sesión en la app con ese correo y contraseña: ya puedes crear un
   San desde `/admin/create-san`.

## Flujo de la aplicación

- **Admin**: crea un San (`/admin/create-san`), agrega participantes
  (`/admin/manage/[id]`, genera usuario + clave temporal automáticamente),
  reordena turnos, registra abonos/pagos completos y publica avisos. Las
  credenciales temporales quedan listadas en `/admin/users`.
- **Participante**: inicia sesión con el correo/clave que le compartió el
  admin y ve en `/` su turno, fecha de cobro, el monto del pozo y la tabla
  de transparencia de todos los participantes del San.

## Seguridad (RLS)

Las políticas en `supabase/schema.sql` se apoyan en funciones
`security definer` (`is_admin`, `is_san_member`, `is_san_admin`) para evitar
recursión al consultar la propia tabla desde su política. La tabla
`member_credentials` (contraseñas temporales) está separada de
`san_members` a propósito y solo es legible por el admin dueño del San —
`san_members` se lee por todos los miembros para la tabla de transparencia,
así que una contraseña ahí sería visible para cualquier participante.

## Build de producción

```bash
npm run build
npm run start
```

El build genera el Service Worker (`public/sw.js`, `public/workbox-*.js`)
automáticamente — están en `.gitignore`, no se versionan. En desarrollo el
PWA plugin está deshabilitado (`disable: NODE_ENV === "development"`).

## Pendiente / siguientes pasos sugeridos

- Reemplazar los íconos placeholder en `public/icons/` por un set de marca
  real (p. ej. con un generador de favicons).
- Opcional: notificaciones push (hay una guía oficial de Next.js para
  Web Push si se quiere avisar a los participantes de nuevos avisos o
  turnos próximos a vencer).

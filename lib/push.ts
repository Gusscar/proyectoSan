import "server-only";
import webpush from "web-push";
import { createAdminClient } from "./supabase/admin";
import type { PushSubscriptionRow } from "./supabase/types";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  configured = true;
}

/** Envía un push a todos los miembros de un San. No lanza si faltan llaves VAPID o no hay suscriptores. */
export async function sendAnnouncementPush(
  sanId: string,
  sanName: string,
  message: string,
) {
  if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return;
  }
  ensureConfigured();

  const adminClient = createAdminClient();

  const { data: members } = await adminClient
    .from("san_members")
    .select("user_id")
    .eq("san_id", sanId);

  const userIds = (members ?? []).map((m) => m.user_id);
  if (userIds.length === 0) return;

  const { data: subs } = await adminClient
    .from("push_subscriptions")
    .select("*")
    .in("user_id", userIds)
    .returns<PushSubscriptionRow[]>();

  if (!subs || subs.length === 0) return;

  const payload = JSON.stringify({
    title: sanName,
    body: message,
    url: "/",
  });

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await adminClient.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }),
  );
}

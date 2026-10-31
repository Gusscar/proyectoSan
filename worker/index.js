// Worker personalizado que @ducanh2912/next-pwa fusiona (vía importScripts)
// dentro del service worker generado. Aquí solo vive la lógica de Web Push;
// el precache/offline lo sigue manejando Workbox en sw.js.

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "SanApp", body: event.data.text() };
  }

  const options = {
    body: payload.body,
    icon: payload.icon || "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    data: { url: payload.url || "/" },
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || "SanApp", options),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientsArr) => {
        const existing = clientsArr.find((c) => c.url.includes(url));
        if (existing) return existing.focus();
        return self.clients.openWindow(url);
      }),
  );
});

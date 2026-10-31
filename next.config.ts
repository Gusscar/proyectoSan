import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  // El service worker y su manifiesto de precache deben revalidarse siempre:
  // si el navegador cachea /sw.js de un deploy anterior, su lista de
  // archivos precacheados apunta a chunks con hash que ya no existen en el
  // deploy actual, y Workbox falla al intentar leerlos ("Unexpected token
  // '<'" al recibir la página 404 de Vercel en vez del JS esperado).
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheOnFrontEndNav: true,
  workboxOptions: {
    skipWaiting: true,
  },
});

export default withPWA(nextConfig);

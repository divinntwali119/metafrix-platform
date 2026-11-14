import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "MetafriX — Plateforme Git & Réseau Social",
    short_name: "MetafriX",
    description:
      "Découvrez des développeurs, partagez vos projets et collaborez autour du code.",
    start_url: "/feed",
    scope: "/",
    display: "standalone",
    background_color: "#111315",
    theme_color: "#111315",
    categories: ["developer", "social"],
    icons: [
      {
        src: "/pwa-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

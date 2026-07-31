import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mind",
    short_name: "Mind",
    description: "Everything worth keeping.",
    start_url: "/",
    display: "standalone",
    background_color: "#EDEEF0",
    theme_color: "#EDEEF0",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}

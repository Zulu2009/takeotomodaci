import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sensei Suki",
    short_name: "Sensei Suki",
    description: "Playful Japanese learning with chat, review loops, and games.",
    start_url: "/",
    display: "standalone",
    background_color: "#fef3c8",
    theme_color: "#de4c2f",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

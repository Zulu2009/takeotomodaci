import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sensei Suki",
  description: "Japanese learning app scaffold with Cloudflare + Firebase + OpenAI",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon",
    apple: "/apple-icon",
  },
  appleWebApp: {
    capable: true,
    title: "Sensei Suki",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

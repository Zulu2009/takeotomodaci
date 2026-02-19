import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sensei Suki",
  description: "Japanese learning app scaffold with Cloudflare + Firebase + OpenAI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

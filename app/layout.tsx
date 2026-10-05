import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./gullie-mobile.css";
import AppIcon from "./app-icon";

export const metadata: Metadata = {
  title: "Gullak · Your savings. Your goals.",
  description: "A little closer to the things you’re saving for.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Gullak", statusBarStyle: "default" },
  robots: { index: false, follow: false },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
};
export const viewport:Viewport={width:"device-width",initialScale:1,viewportFit:"cover",themeColor:[{media:"(prefers-color-scheme: light)",color:"#f8faf7"},{media:"(prefers-color-scheme: dark)",color:"#121715"}]};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head><link rel="preload" href="/fonts/InterVariable.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/></head>
      <body className="antialiased"><AppIcon/>{children}</body>
    </html>
  );
}

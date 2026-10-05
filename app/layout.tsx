import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./gullie-mobile.css";
import AppIcon from "./app-icon";
import AppUpdates from "./app-updates";
import UsageAnalytics from "./usage-analytics";
import {siteOrigin,siteDescription} from "./seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: {default:"Gullak — Savings Goals & Money Tracker",template:"%s · Gullak"},
  description: siteDescription,
  alternates: {canonical:"/"},
  openGraph:{type:"website",siteName:"Gullak",url:siteOrigin+"/",title:"Gullak — Savings Goals & Money Tracker",description:siteDescription},
  twitter:{card:"summary",title:"Gullak — Savings Goals & Money Tracker",description:siteDescription},
  verification:{google:"-Q4tiO103O9tPd4vYl1RW7h_xTtzrwOhNUxsMRxrOw8"},
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
      <body className="antialiased"><AppIcon/><AppUpdates/><UsageAnalytics/>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gullak · Your savings. Your goals.",
  description: "Your private pots for the things you’re saving for.",
  robots: { index: false, follow: false },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

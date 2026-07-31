import type { Metadata, Viewport } from "next";
import { Inter_Tight, Newsreader } from "next/font/google";
import "./globals.css";

const ui = Inter_Tight({ subsets: ["latin"], variable: "--font-ui" });
const display = Newsreader({ subsets: ["latin"], style: ["italic"], variable: "--font-display" });

export const metadata: Metadata = { title: "Mind", description: "Everything worth keeping." };

// Tints the browser chrome on mobile to match the page background.
export const viewport: Viewport = { themeColor: "#EDEEF0" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ui.variable} ${display.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

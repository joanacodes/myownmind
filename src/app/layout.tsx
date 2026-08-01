import type { Metadata, Viewport } from "next";
import { Inter_Tight, Newsreader } from "next/font/google";
import "./globals.css";
import { SessionKeeper } from "@/components/SessionKeeper";

const ui = Inter_Tight({ subsets: ["latin"], variable: "--font-ui" });
const display = Newsreader({ subsets: ["latin"], style: ["italic"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Mind",
  description: "Everything worth keeping.",
  // iOS ignores the manifest's display mode on older versions; these tags are
  // what actually strip the Safari chrome once added to the home screen.
  appleWebApp: { capable: true, title: "Mind", statusBarStyle: "default" },
};

// Tints the browser chrome on mobile to match the page background.
export const viewport: Viewport = {
  themeColor: "#EDEEF0",
  // Keeps content clear of the notch and home indicator in standalone mode.
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ui.variable} ${display.variable}`}>
      <body className="font-sans antialiased">
        <SessionKeeper />
        {children}
      </body>
    </html>
  );
}

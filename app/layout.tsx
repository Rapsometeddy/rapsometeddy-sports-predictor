import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rapsometeddy MATCH IQ — Sports Records Lab",
  description: "Offline-first, non-wagering sports results archives with separate sport-specific datasets.",
  icons: { icon: "/crowned-r.svg" },
};

export const viewport: Viewport = {
  themeColor: "#09070f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}

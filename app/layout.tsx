import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rapsometeddy Football Match Lab",
  description: "Offline-first educational football analytics with manual inputs and local historical match data.",
  icons: { icon: "/crowned-r.svg" },
  themeColor: "#09070f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}

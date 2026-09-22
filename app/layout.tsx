import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"Rapsometeddy Sports Predictor",description:"Football outcome prediction dashboard"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Neo — Personal Finance", description: "A clear view of your money, assets and goals.", manifest: "/manifest.webmanifest", themeColor: "#10251b" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-IN"><body>{children}</body></html>;
}
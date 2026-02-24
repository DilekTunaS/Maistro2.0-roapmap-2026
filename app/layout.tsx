import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Maistro - Sprint Bulletin & Roadmap Hub",
  description: "Executive sprint bulletin and roadmap dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        <main className="container-shell py-8 sm:py-10">{children}</main>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { SearchModal } from "@/components/layout/SearchModal";
import { StoreHydration } from "@/components/layout/StoreHydration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MetafriX — Plateforme Git & Réseau Social pour Développeurs",
  description:
    "MetafriX combine la gestion de dépôts Git et un réseau social dédié aux développeurs et professionnels tech.",
  icons: {
    icon: "/metafrix-fox.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-(--primary-text)">
        <StoreHydration />
        <Navbar />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <SearchModal />
      </body>
    </html>
  );
}

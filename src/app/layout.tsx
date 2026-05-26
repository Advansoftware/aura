import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RespondiA Games - O Maior Catálogo de Jogos de PC via Torrent",
  description: "Encontre, busque e baixe os melhores jogos de PC via torrent de forma rápida e 100% gratuita. Interface premium com trailers no estilo Netflix, screenshots e requisitos.",
  keywords: ["games", "torrent", "baixar jogos", "jogos gratis", "jogos torrent", "steam verde", "respondia games", "jogos de pc"],
  authors: [{ name: "RespondiA Games" }],
  openGraph: {
    title: "RespondiA Games - O Maior Catálogo de Jogos de PC via Torrent",
    description: "Encontre, busque e baixe os melhores jogos de PC via torrent de forma rápida e 100% gratuita. Interface premium com trailers, screenshots e requisitos.",
    url: "https://games.respondia.pro",
    siteName: "RespondiA Games",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RespondiA Games - O Maior Catálogo de Jogos de PC via Torrent",
    description: "Encontre, busque e baixe os melhores jogos de PC via torrent de forma rápida e 100% gratuita.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.className} h-full antialiased`}>
      <body className="min-h-full bg-[#090b11] text-gray-100">
        {children}
      </body>
    </html>
  );
}

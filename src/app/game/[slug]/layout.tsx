import { Metadata } from 'next';
import { getGameBySlug } from '@/lib/db';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const game = getGameBySlug(resolvedParams.slug);

  if (!game) {
    return {
      title: 'Jogo Não Encontrado - RespondiA Games',
    };
  }

  const cleanDescription = game.description
    ? game.description.replace(/<[^>]*>/g, '').substring(0, 160) + '...'
    : `Baixe ${game.title} via torrent gratuitamente no RespondiA Games.`;

  return {
    title: `${game.title} - Baixar Torrent Grátis | RespondiA Games`,
    description: cleanDescription,
    openGraph: {
      title: `${game.title} - Baixar Torrent Grátis | RespondiA Games`,
      description: cleanDescription,
      url: `https://games.respondia.pro/game/${game.slug}`,
      siteName: "RespondiA Games",
      locale: "pt_BR",
      type: "website",
      images: game.image ? [{ url: game.image }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${game.title} - Baixar Torrent Grátis | RespondiA Games`,
      description: cleanDescription,
      images: game.image ? [game.image] : [],
    },
  };
}

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

'use client';

import { GameCard } from './GameCard';

interface Game {
  slug: string;
  title: string;
  image: string | null;
  file_size: string | null;
  version: string | null;
  categories: string | null;
}

export function GameGrid({ games }: { games: Game[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
      {games.map(game => (
        <GameCard key={game.slug} game={game} />
      ))}
    </div>
  );
}

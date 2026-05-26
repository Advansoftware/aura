'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Game {
  slug: string;
  title: string;
  image: string | null;
  file_size: string | null;
  version: string | null;
  categories: string | null;
}

export function GameCard({ game }: { game: Game }) {
  const [imgError, setImgError] = useState(false);

  const categoryList = game.categories?.split(',').filter(Boolean) || [];
  const mainCategory = categoryList[0] || 'jogo';

  return (
    <Link href={`/game/${game.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-lg bg-[#1a1a2e] border border-[#16213e] transition-all duration-300 hover:border-[#0f3460] hover:shadow-lg hover:shadow-[#0f3460]/20 hover:-translate-y-1">
        <div className="aspect-[3/4] overflow-hidden bg-[#0d0d1a]">
          {game.image && !imgError ? (
            <img
              src={game.image}
              alt={game.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
        </div>

        <div className="p-3">
          <span className="inline-block px-2 py-0.5 text-xs font-medium text-[#e94560] bg-[#e94560]/10 rounded mb-2 uppercase tracking-wider">
            {mainCategory}
          </span>
          <h3 className="text-sm font-semibold text-gray-100 line-clamp-2 leading-snug group-hover:text-[#e94560] transition-colors">
            {game.title}
          </h3>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            {game.file_size && <span>{game.file_size}</span>}
            {game.version && <span>v{game.version}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

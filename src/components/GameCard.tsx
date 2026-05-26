'use client';

import { useState, MouseEvent } from 'react';
import Link from 'next/link';

interface Game {
  slug: string;
  title: string;
  image: string | null;
  file_size: string | null;
  version: string | null;
  download_url: string | null;
  magnet_url: string | null;
  categories: string | null;
}

export function GameCard({ game }: { game: Game }) {
  const [imgError, setImgError] = useState(false);

  const categoryList = game.categories?.split(',').filter(Boolean) || [];
  const mainCategory = categoryList[0] || 'jogo';

  const handleQuickDownload = (e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const targetUrl = game.magnet_url || game.download_url;
    if (targetUrl) {
      window.open(targetUrl, '_blank');
    }
  };

  const hasDownloadLink = !!(game.magnet_url || game.download_url);

  return (
    <Link href={`/game/${game.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-lg bg-[#1a1a2e] border border-[#16213e] transition-all duration-500 hover:border-[#e94560]/40 hover:shadow-[0_0_22px_rgba(233,69,96,0.18)] hover:-translate-y-1.5">
        
        {/* Container da Imagem com Aspect Ratio */}
        <div className="relative aspect-[3/4] overflow-hidden bg-[#0d0d1a]">
          
          {/* Pílula de Tamanho do Jogo */}
          {game.file_size && (
            <div className="absolute top-2 left-2 z-20 px-2 py-0.5 text-[10px] font-bold text-gray-200 bg-black/75 backdrop-blur-md border border-white/10 rounded shadow-md select-none">
              {game.file_size}
            </div>
          )}

          {/* Botão de Download Rápido (Aparece no Hover) */}
          {hasDownloadLink && (
            <button
              onClick={handleQuickDownload}
              title={game.magnet_url ? "Baixar via Torrent Rápido" : "Baixar Jogo"}
              className="absolute top-2 right-2 z-20 p-2 text-white bg-[#e94560] hover:bg-[#d63851] rounded-full shadow-lg transition-all duration-300 md:opacity-0 md:group-hover:opacity-100 md:translate-y-[-4px] md:group-hover:translate-y-0 scale-90 hover:scale-105 cursor-pointer border border-white/10"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          )}

          {/* Imagem do Card */}
          {game.image && !imgError ? (
            <>
              <img
                src={game.image}
                alt={game.title}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                onError={() => setImgError(true)}
                loading="lazy"
              />
              {/* Vinheta/Sombra na base da imagem */}
              <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/70 to-transparent z-10 pointer-events-none" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l-3.197 2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
        </div>

        {/* Rodapé de Informações */}
        <div className="p-3 bg-gradient-to-b from-[#1a1a2e] to-[#121224]">
          <span className="inline-block px-2 py-0.5 text-xs font-semibold text-[#e94560] bg-[#e94560]/10 rounded mb-2 uppercase tracking-wider select-none">
            {mainCategory}
          </span>
          <h3 className="text-sm font-semibold text-gray-100 line-clamp-2 leading-snug group-hover:text-[#e94560] transition-colors duration-300">
            {game.title}
          </h3>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            {game.version && (
              <span className="flex items-center gap-1">
                <span className="text-gray-600 font-bold">v</span>
                {game.version}
              </span>
            )}
            {game.file_size && (
              <span className="text-[10px] text-gray-500 font-medium px-1 border border-gray-800 rounded select-none">
                MÍDIA
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

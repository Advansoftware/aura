'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameGrid } from '@/components/GameGrid';
import { SearchBar } from '@/components/SearchBar';
import Link from 'next/link';
import { Game } from '@/types/game';

function stripHtml(html: string | null): string {
  if (!html) return '';
  // Substitui tags de quebra de linha por espaço
  let text = html.replace(/<br\s*\/?>/gi, ' ');
  text = text.replace(/<p>/gi, ' ');
  text = text.replace(/<\/p>/gi, ' ');
  // Remove todas as outras tags HTML
  text = text.replace(/<[^>]*>/g, '');
  // Remove múltiplos espaços sequenciais
  text = text.replace(/\s+/g, ' ').trim();
  
  // Limita o tamanho e adiciona reticências de forma limpa se necessário
  if (text.length > 300) {
    return text.substring(0, 297) + '...';
  }
  return text;
}

export default function HomePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [lastScrape, setLastScrape] = useState<string | null>(null);
  const heroIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const fetchGames = useCallback(async (searchQuery?: string) => {
    setLoading(true);
    try {
      const url = searchQuery ? `/api/games?q=${encodeURIComponent(searchQuery)}` : '/api/games';
      const res = await fetch(url);
      const data = await res.json();
      setGames(data.games || []);
      setLastScrape(data.lastScrape || null);
    } catch (err) {
      console.error('Failed to fetch games:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const handleSearch = (q: string) => {
    setQuery(q);
    fetchGames(q || undefined);
  };

  const heroGames = games.slice(0, 6);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    if (heroGames.length === 0) return;
    heroIntervalRef.current = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroGames.length);
    }, 5000);
    return () => {
      if (heroIntervalRef.current) clearInterval(heroIntervalRef.current);
    };
  }, [heroGames.length]);

  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      <div className="sticky top-0 z-40 bg-[#0a0a1a]/95 backdrop-blur-sm border-b border-[#16213e]">
        <div className="max-w-[1600px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-[#e94560]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <h1 className="text-xl font-bold text-white tracking-tight">
                <span className="text-[#e94560]">Aura</span>
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <SearchBar onSearch={handleSearch} />
              <Link
                href="/biblioteca"
                className="flex items-center gap-2 px-3 py-2 bg-[#16213e] hover:bg-[#1a2744] border border-[#0f3460] rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="hidden sm:inline">Biblioteca</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {!query && !loading && heroGames.length > 0 && (
        <div className="relative h-[480px] sm:h-[540px] md:h-[65vh] min-h-[460px] overflow-hidden bg-black">
          {heroGames.map((g, i) => {
            const cleanDescription = stripHtml(g.description);
            const relevance = 92 + (g.title.length % 8);

            return (
              <div
                key={g.slug}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  i === heroIndex ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
                }`}
              >
                {/* Netflix Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] via-[#0a0a1a]/50 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a1a] via-[#0a0a1a]/70 to-transparent z-10" />
                <div className="absolute inset-0 bg-black/20 z-10" />

                {g.image && (
                  <img
                    src={g.image}
                    alt={g.title}
                    className="w-full h-full object-cover object-[center_20%] transition-transform duration-[8000ms] ease-out scale-105"
                  />
                )}

                <div className="absolute inset-x-0 bottom-0 z-20 pb-12 md:pb-16 px-6 sm:px-12 md:px-16 max-w-[1600px] mx-auto">
                  <div className="max-w-3xl">
                    {/* Badge Netflix-style */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="flex items-center justify-center bg-[#e94560] text-white font-black text-[10px] w-5 h-5 rounded shadow-sm">
                        A
                      </span>
                      <span className="text-xs font-bold tracking-[0.3em] text-[#e94560] uppercase drop-shadow-md">
                        Original Aura
                      </span>
                    </div>

                    {/* Título do Jogo */}
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-lg mb-4 leading-none select-none">
                      {g.title}
                    </h2>

                    {/* Metadados */}
                    <div className="flex flex-wrap items-center gap-3 text-sm mb-4">
                      <span className="font-bold text-[#46d369] drop-shadow-sm">
                        {relevance}% de Relevância
                      </span>
                      <span className="text-gray-300 font-semibold">
                        {g.updated_at ? new Date(g.updated_at).getFullYear() : new Date().getFullYear()}
                      </span>
                      {g.file_size && (
                        <span className="px-1.5 py-0.2 border border-gray-500 rounded text-xs text-gray-300 font-semibold uppercase">
                          {g.file_size}
                        </span>
                      )}
                      {g.version && (
                        <span className="px-1.5 py-0.2 border border-gray-500/50 rounded text-xs text-gray-400 font-medium">
                          v{g.version}
                        </span>
                      )}
                      {g.categories && (
                        <span className="text-gray-300 font-medium hidden sm:inline">
                          {g.categories.split(',').slice(0, 2).map(c => c.trim().replace(/-/g, ' ')).join(' • ')}
                        </span>
                      )}
                    </div>

                    {/* Descrição / Sinopse */}
                    {cleanDescription && (
                      <p className="text-gray-300 text-sm md:text-base leading-relaxed max-w-2xl mb-6 line-clamp-3 drop-shadow-md font-light">
                        {cleanDescription}
                      </p>
                    )}

                    {/* Botões Netflix-style */}
                    <div className="flex items-center gap-3">
                      {g.magnet_url ? (
                        <button
                          onClick={() => window.open(g.magnet_url!, '_blank')}
                          className="px-6 py-2.5 bg-white text-black font-bold rounded hover:bg-white/80 transition-colors inline-flex items-center gap-2 text-sm md:text-base shadow-lg cursor-pointer"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Baixar Agora
                        </button>
                      ) : g.download_url ? (
                        <a
                          href={g.download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-2.5 bg-white text-black font-bold rounded hover:bg-white/80 transition-colors inline-flex items-center gap-2 text-sm md:text-base shadow-lg cursor-pointer"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Baixar Agora
                        </a>
                      ) : (
                        <Link
                          href={`/game/${g.slug}`}
                          className="px-6 py-2.5 bg-white text-black font-bold rounded hover:bg-white/80 transition-colors inline-flex items-center gap-2 text-sm md:text-base shadow-lg cursor-pointer"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Baixar Agora
                        </Link>
                      )}

                      <Link
                        href={`/game/${g.slug}`}
                        className="px-6 py-2.5 bg-gray-500/30 hover:bg-gray-500/40 text-white font-bold rounded transition-colors inline-flex items-center gap-2 text-sm md:text-base border border-white/10 backdrop-blur-sm shadow-lg cursor-pointer"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Mais Informações
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Barrinhas Horizontais de Carrossel Netflix */}
          <div className="absolute bottom-6 right-8 z-20 flex gap-2">
            {heroGames.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroIndex(i)}
                className={`h-[3px] rounded-full transition-all duration-300 cursor-pointer ${
                  i === heroIndex ? 'bg-[#e94560] w-8' : 'bg-gray-600 hover:bg-gray-400 w-4'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <main className="max-w-[1600px] mx-auto px-4 py-6">
        {lastScrape && !query && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-200">Biblioteca</h2>
              <span className="text-sm text-gray-500">{games.length} jogos</span>
            </div>
            <div className="text-xs text-gray-600">
              Última atualização: {new Date(lastScrape).toLocaleDateString('pt-BR', {
                day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </div>
          </div>
        )}

        {query && (
          <div className="mb-4 text-sm text-gray-400">
            Resultados para: <span className="text-gray-200 font-medium">&ldquo;{query}&rdquo;</span>
            <span className="ml-2 text-gray-600">({games.length} jogos)</span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-[#1a1a2e] rounded-lg" />
                <div className="mt-2 space-y-2">
                  <div className="h-3 bg-[#1a1a2e] rounded w-3/4" />
                  <div className="h-3 bg-[#1a1a2e] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : games.length > 0 ? (
          <GameGrid games={games} />
        ) : (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 text-lg mb-2">Nenhum jogo encontrado</p>
            <p className="text-gray-600 text-sm">
              {query ? 'Tente outro termo de busca' : 'Nenhum jogo disponível no momento'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

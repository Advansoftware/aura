'use client';

import { useState, useEffect, useCallback } from 'react';
import { GameGrid } from '@/components/GameGrid';
import { SearchBar } from '@/components/SearchBar';
import Link from 'next/link';
import { Game } from '@/types/game';

export default function BibliotecaPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 24;

  const fetchGames = useCallback(async (q: string, p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      params.set('page', String(p));
      params.set('limit', String(limit));
      const res = await fetch(`/api/games?${params}`);
      const data = await res.json();
      setGames(data.games || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch games:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames(query, page);
  }, [fetchGames, query, page]);

  const handleSearch = (q: string) => {
    setQuery(q);
    setPage(1);
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-40 bg-[#090b11]/85 backdrop-blur-md border-b border-white/5">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg font-semibold text-white">Biblioteca</h1>
            <span className="text-sm text-gray-500">{total} jogos</span>
          </div>
          <SearchBar onSearch={handleSearch} />
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 py-6">
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
                <div className="aspect-[3/4] bg-white/5 border border-white/5 rounded-lg animate-pulse" />
                <div className="mt-2 space-y-2">
                  <div className="h-3 bg-white/5 rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-white/5 rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : games.length > 0 ? (
          <>
            <GameGrid games={games} />
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white hover:border-[#00fe9b]/50 hover:bg-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Anterior
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                    let p: number;
                    if (totalPages <= 7) {
                      p = i + 1;
                    } else if (page <= 4) {
                      p = i + 1;
                    } else if (page >= totalPages - 3) {
                      p = totalPages - 6 + i;
                    } else {
                      p = page - 3 + i;
                    }
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                          p === page
                            ? 'bg-[#00fe9b] text-black font-semibold shadow-[0_0_10px_rgba(0,254,155,0.3)]'
                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5 cursor-pointer'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white hover:border-[#00fe9b]/50 hover:bg-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Próximo
                </button>
              </div>
            )}
          </>
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
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ImageLightbox } from '@/components/ImageLightbox';

interface GameDetail {
  slug: string;
  title: string;
  image: string | null;
  description: string | null;
  file_size: string | null;
  version: string | null;
  download_url: string | null;
  magnet_url: string | null;
  categories: string | null;
  views: number | null;
  update_date: string | null;
  screenshots: string | null;
  system_requirements: string | null;
  trailer_url: string | null;
}

export default function GameDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [game, setGame] = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    fetch(`/api/game/${slug}`)
      .then(res => res.json())
      .then(data => {
        setGame(data.game);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#e94560] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg">Jogo não encontrado</p>
          <Link href="/" className="text-[#e94560] hover:underline mt-2 inline-block">Voltar à biblioteca</Link>
        </div>
      </div>
    );
  }

  const screenshots: string[] = game.screenshots ? JSON.parse(game.screenshots) : [];
  const requirements: Record<string, string> = game.system_requirements ? JSON.parse(game.system_requirements) : {};
  const categoryList = game.categories?.split(',').filter(Boolean) || [];

  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      {lightboxIndex !== null && (
        <ImageLightbox images={screenshots} index={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}

      <div className="sticky top-0 z-40 bg-[#0a0a1a]/95 backdrop-blur-sm border-b border-[#16213e]">
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold text-white truncate flex-1">{game.title}</h1>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-80 shrink-0">
            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-[#1a1a2e] border border-[#16213e]">
              {game.image ? (
                <img src={game.image} alt={game.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                  <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  </svg>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-3">
              {game.magnet_url ? (
                <button
                  onClick={() => window.open(game.magnet_url!, '_blank')}
                  className="w-full py-3 px-4 bg-[#e94560] hover:bg-[#d63851] text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Baixar Torrent
                </button>
              ) : game.download_url ? (
                <a
                  href={game.download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-[#e94560] hover:bg-[#d63851] text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Baixar
                </a>
              ) : null}

              <div className="bg-[#1a1a2e] border border-[#16213e] rounded-lg p-4 space-y-2">
                {game.file_size && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tamanho</span>
                    <span className="text-gray-200">{game.file_size}</span>
                  </div>
                )}
                {game.version && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Versão</span>
                    <span className="text-gray-200">{game.version}</span>
                  </div>
                )}
                {game.update_date && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Atualizado</span>
                    <span className="text-gray-200">{game.update_date}</span>
                  </div>
                )}
                {game.views !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Visualizações</span>
                    <span className="text-gray-200">{game.views.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {categoryList.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {categoryList.map(cat => (
                    <span key={cat} className="px-2.5 py-1 text-xs font-medium text-[#e94560] bg-[#e94560]/10 rounded-full capitalize">
                      {cat.replace(/-/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {game.description && (
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-gray-200 mb-3">Descrição</h2>
                {game.description.length > 400 ? (
                  <div>
                    <div
                      className={`text-sm text-gray-400 leading-relaxed prose prose-invert max-w-none
                        prose-headings:text-gray-200 prose-a:text-[#e94560] prose-strong:text-gray-300
                        ${descExpanded ? '' : 'line-clamp-4'}`}
                      dangerouslySetInnerHTML={{ __html: game.description }}
                    />
                    <button
                      onClick={() => setDescExpanded(!descExpanded)}
                      className="mt-2 text-sm text-[#e94560] hover:underline font-medium"
                    >
                      {descExpanded ? 'Ver menos' : 'Ver mais'}
                    </button>
                  </div>
                ) : (
                  <div
                    className="text-sm text-gray-400 leading-relaxed prose prose-invert max-w-none
                      prose-headings:text-gray-200 prose-a:text-[#e94560] prose-strong:text-gray-300"
                    dangerouslySetInnerHTML={{ __html: game.description }}
                  />
                )}
              </section>
            )}

            {screenshots.length > 0 && (
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-gray-200 mb-3">Imagens</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {screenshots.map((src, i) => (
                    <button key={i} onClick={() => setLightboxIndex(i)}
                      className="aspect-video rounded-lg overflow-hidden bg-[#1a1a2e] border border-[#16213e] hover:border-[#e94560] transition-colors cursor-pointer text-left">
                      <img src={src} alt={`Imagem ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {Object.keys(requirements).length > 0 && (
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-gray-200 mb-3">Requisitos do Sistema</h2>
                <div className="bg-[#1a1a2e] border border-[#16213e] rounded-lg p-4">
                  <div className="space-y-2">
                    {Object.entries(requirements).map(([key, val]) => (
                      <div key={key} className="flex gap-2 text-sm">
                        <span className="text-gray-500 font-medium shrink-0">{key}:</span>
                        <span className="text-gray-300">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {game.magnet_url && (
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-gray-200 mb-3">Link Magnético</h2>
                <div className="bg-[#1a1a2e] border border-[#16213e] rounded-lg p-3">
                  <p className="text-xs text-gray-500 break-all mb-3">{game.magnet_url}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(game.magnet_url!)}
                      className="px-4 py-2 text-sm font-medium text-white bg-[#16213e] hover:bg-[#1a2744] border border-[#0f3460] rounded-lg transition-colors"
                    >
                      Copiar link
                    </button>
                    <button
                      onClick={() => window.open(game.magnet_url!, '_blank')}
                      className="px-4 py-2 text-sm font-medium text-white bg-[#e94560] hover:bg-[#d63851] rounded-lg transition-colors"
                    >
                      Abrir torrent
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

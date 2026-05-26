'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ImageLightbox } from '@/components/ImageLightbox';
import { getYouTubeId } from '@/lib/utils';

interface GameComment {
  author: string;
  date: string;
  content: string;
  likes?: number;
  replies?: GameComment[];
}

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
  comments?: string | null;
}

function CommentNode({ comment, depth = 0 }: { comment: GameComment; depth?: number }) {
  return (
    <div className={`group relative flex flex-col gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 hover:border-[#00fe9b]/20 hover:bg-white/[0.03] ${depth > 0 ? 'ml-4 sm:ml-8 border-l-2 border-l-[#00fe9b]/30' : ''}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {/* Avatar com efeito neon sutil */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00fe9b]/20 to-[#00d668]/10 flex items-center justify-center border border-[#00fe9b]/30 text-xs font-semibold text-[#00fe9b] uppercase shadow-[0_0_8px_rgba(0,254,155,0.1)]">
            {comment.author.substring(0, 2)}
          </div>
          <div>
            <span className="text-sm font-semibold text-gray-200 group-hover:text-[#00fe9b] transition-colors">{comment.author}</span>
            {comment.likes !== undefined && comment.likes > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] font-medium text-[#00fe9b] bg-[#00fe9b]/10 border border-[#00fe9b]/20 rounded-full">
                👍 {comment.likes}
              </span>
            )}
          </div>
        </div>
        <span className="text-xs text-gray-500">{comment.date}</span>
      </div>

      <div 
        className="text-xs sm:text-sm text-gray-400 leading-relaxed break-words prose prose-invert max-w-none 
          prose-p:m-0 prose-a:text-[#00fe9b] prose-strong:text-gray-300"
        dangerouslySetInnerHTML={{ __html: comment.content }}
      />

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply, i) => (
            <CommentNode key={i} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#00fe9b] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg">Jogo não encontrado</p>
          <Link href="/" className="text-[#00fe9b] hover:underline mt-2 inline-block">Voltar à biblioteca</Link>
        </div>
      </div>
    );
  }

  const screenshots: string[] = game.screenshots ? JSON.parse(game.screenshots) : [];
  const requirements: Record<string, string> = game.system_requirements ? JSON.parse(game.system_requirements) : {};
  const categoryList = game.categories?.split(',').filter(Boolean) || [];

  const isHypervisor = game.title.toLowerCase().includes('hypervisor') || 
                       game.slug.toLowerCase().includes('hypervisor') ||
                       game.categories?.toLowerCase().includes('hypervisor') || false;

  return (
    <div className="min-h-screen">
      {lightboxIndex !== null && (
        <ImageLightbox images={screenshots} index={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}

      <div className="sticky top-0 z-40 bg-[#090b11]/85 backdrop-blur-md border-b border-white/5">
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
            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-white/5 border border-white/5">
              {game.image ? (
                <img src={game.image} alt={game.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                  <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l-3.197 2.132a1 1 0 000-1.664z" />
                  </svg>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-3">
              {game.magnet_url ? (
                <button
                  onClick={() => window.open(game.magnet_url!, '_blank')}
                  className="w-full py-3 px-4 bg-[#00fe9b] hover:bg-[#00d668] text-black font-semibold rounded-lg shadow-[0_0_12px_rgba(0,254,155,0.3)] transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
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
                  className="w-full py-3 px-4 bg-[#00fe9b] hover:bg-[#00d668] text-black font-semibold rounded-lg shadow-[0_0_12px_rgba(0,254,155,0.3)] transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Baixar
                </a>
              ) : null}

              <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-2">
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
                    <span key={cat} className="px-2.5 py-1 text-xs font-medium text-[#00fe9b] bg-[#00fe9b]/10 rounded-full capitalize">
                      {cat.replace(/-/g, ' ')}
                    </span>
                  ))}
                </div>
              )}

              {isHypervisor && (
                <div className="mt-3 px-3 py-2 text-xs font-black bg-[#ff003c] text-white rounded-lg flex items-center justify-center gap-1.5 shadow-[0_0_8px_rgba(255,0,60,0.3)] uppercase tracking-wider select-none">
                  HYPERVISOR
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {isHypervisor && (
              <div className="mb-6 p-4 rounded-xl border border-[#ffd700]/20 bg-gradient-to-r from-[#ffd700]/5 via-transparent to-transparent flex gap-3 items-start backdrop-blur-sm shadow-[0_0_15px_rgba(255,215,0,0.02)]">
                <span className="text-xl shrink-0">⚠️</span>
                <div className="space-y-1.5">
                  <p className="text-sm font-bold text-[#ffd700] uppercase tracking-wider">Aviso Especial: Launcher Hypervisor Requerido</p>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Este jogo utiliza uma tecnologia de virtualização personalizada para inicialização e funcionamento. Certifique-se de seguir os requisitos abaixo para rodar o jogo com sucesso:
                  </p>
                  <ul className="list-disc pl-4 text-xs text-gray-400 space-y-1 mt-1">
                    <li>Habilite a <span className="font-semibold text-gray-200">Virtualização (VT-x na Intel ou AMD-V na AMD)</span> diretamente nas configurações de BIOS da sua placa-mãe.</li>
                    <li>O recurso de Hypervisor do Windows (como Hyper-V e isolamento de núcleo) pode ser requerido ou necessitar de ajuste.</li>
                    <li>Sistemas de antivírus costumam acusar falso positivo devido à virtualização. Pode ser necessário criar exclusão para a pasta do jogo.</li>
                    <li>Confira as dicas detalhadas de instalação e funcionamento fornecidas pela comunidade na seção de <span className="text-[#00fe9b] font-medium">Comentários</span> no rodapé desta página.</li>
                  </ul>
                </div>
              </div>
            )}
            {game.description && (
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-gray-200 mb-3">Descrição</h2>
                {game.description.length > 400 ? (
                  <div>
                    <div
                      className={`text-sm text-gray-400 leading-relaxed prose prose-invert max-w-none
                        prose-headings:text-gray-200 prose-a:text-[#00fe9b] prose-strong:text-gray-300
                        ${descExpanded ? '' : 'line-clamp-4'}`}
                      dangerouslySetInnerHTML={{ __html: game.description }}
                    />
                    <button
                      onClick={() => setDescExpanded(!descExpanded)}
                      className="w-full mt-3 py-2.5 px-4 text-xs font-semibold text-[#00fe9b] bg-[#00fe9b]/5 hover:bg-[#00fe9b]/10 border border-[#00fe9b]/15 hover:border-[#00fe9b]/30 rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.005] active:scale-[0.995] select-none"
                    >
                      {descExpanded ? (
                        <>
                          Ver menos
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                          </svg>
                        </>
                      ) : (
                        <>
                          Ver mais
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div
                    className="text-sm text-gray-400 leading-relaxed prose prose-invert max-w-none
                      prose-headings:text-gray-200 prose-a:text-[#00fe9b] prose-strong:text-gray-300"
                    dangerouslySetInnerHTML={{ __html: game.description }}
                  />
                )}
              </section>
            )}

            {/* Trailer Oficial do Jogo */}
            {game.trailer_url && getYouTubeId(game.trailer_url) && (
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-gray-200 mb-3">Trailer Oficial</h2>
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-white/5 border border-white/5 shadow-2xl relative">
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeId(game.trailer_url)}?autoplay=0&rel=0&modestbranding=1`}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    frameBorder="0"
                  />
                </div>
              </section>
            )}

            {screenshots.length > 0 && (
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-gray-200 mb-3">Imagens</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {screenshots.map((src, i) => (
                    <button key={i} onClick={() => setLightboxIndex(i)}
                      className="aspect-video rounded-xl overflow-hidden bg-white/5 border border-white/5 hover:border-[#00fe9b] transition-all cursor-pointer text-left">
                      <img src={src} alt={`Imagem ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {Object.keys(requirements).length > 0 && (
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-gray-200 mb-3">Requisitos do Sistema</h2>
                <div className="bg-white/5 border border-white/5 rounded-xl p-4">
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
                <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                  <p className="text-xs text-gray-500 break-all mb-3">{game.magnet_url}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(game.magnet_url!)}
                      className="px-4 py-2 text-sm font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all cursor-pointer"
                    >
                      Copiar link
                    </button>
                    <button
                      onClick={() => window.open(game.magnet_url!, '_blank')}
                      className="px-4 py-2 text-sm font-medium text-black bg-[#00fe9b] hover:bg-[#00d668] rounded-lg shadow-[0_0_10px_rgba(0,254,155,0.3)] transition-all cursor-pointer"
                    >
                      Abrir torrent
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Seção de Comentários e Dicas Importadas */}
            {game.comments ? (
              (() => {
                try {
                  const commentsList = JSON.parse(game.comments) as GameComment[];
                  if (commentsList.length === 0) return null;
                  return (
                    <section className="mb-8 border-t border-white/5 pt-8">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xl">💬</span>
                        <h2 className="text-lg font-semibold text-gray-200">
                          Comentários e Dicas da Comunidade
                        </h2>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#00fe9b]/10 border border-[#00fe9b]/20 text-[#00fe9b] font-medium">
                          {commentsList.length} originais
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-400 mb-6 leading-relaxed bg-white/[0.02] border border-white/5 rounded-xl p-4 flex gap-3 items-start">
                        <span className="text-base mt-0.5">💡</span>
                        <div>
                          <p className="font-semibold text-gray-300 mb-0.5">Dica importante</p>
                          <p>Estes comentários e instruções foram importados diretamente da comunidade do site original (Steam Verde) e servem como apoio de instalação, correções de bugs específicos e feedbacks sobre o funcionamento.</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {commentsList.map((comment, i) => (
                          <CommentNode key={i} comment={comment} />
                        ))}
                      </div>
                    </section>
                  );
                } catch (e) {
                  return null;
                }
              })()
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

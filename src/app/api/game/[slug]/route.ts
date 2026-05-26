import { NextRequest, NextResponse } from 'next/server';
import { getGameBySlug, incrementGameViews } from '@/lib/db';
import { scrapeGameDetail } from '@/lib/scraper';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    let game = getGameBySlug(slug);

    if (!game) {
      try {
        game = await scrapeGameDetail(slug);
      } catch {
        return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });
      }
    }

    // Incrementa visualização real local no nosso banco
    incrementGameViews(slug);

    // Retorna o jogo com a visualização local já incrementada
    const updatedGame = getGameBySlug(slug) || game;

    return NextResponse.json({ game: updatedGame });
  } catch (err) {
    console.error('Error in GET /api/game/[slug]:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getGameBySlug } from '@/lib/db';
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

    return NextResponse.json({ game });
  } catch (err) {
    console.error('Error in GET /api/game/[slug]:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

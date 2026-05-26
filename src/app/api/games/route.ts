import { NextRequest, NextResponse } from 'next/server';
import { getAllGames, getGamesPaginated, searchGames, getLastScrapeTime, Game } from '@/lib/db';
import { scrapeIfNeeded } from '@/lib/scraper';

export async function GET(request: NextRequest) {
  try {
    scrapeIfNeeded().catch(err => console.error('Background scrape failed:', err));

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '24', 10)));

    const mapGame = (g: Game) => ({
      slug: g.slug,
      title: g.title,
      image: g.image,
      description: g.description,
      file_size: g.file_size,
      version: g.version,
      download_url: g.download_url,
      magnet_url: g.magnet_url,
      categories: g.categories,
      views: g.views,
      updated_at: g.updated_at,
    });

    if (query) {
      const games = searchGames(query);
      return NextResponse.json({
        games: games.slice(0, limit).map(mapGame),
        total: games.length,
        page: 1,
        totalPages: 1,
        lastScrape: getLastScrapeTime(),
      });
    }

    const { games, total } = getGamesPaginated(page, limit);

    return NextResponse.json({
      games: games.map(mapGame),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      lastScrape: getLastScrapeTime(),
    });
  } catch (err) {
    console.error('Error in GET /api/games:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

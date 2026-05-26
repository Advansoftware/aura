import { NextRequest, NextResponse } from 'next/server';
import { scrapeAll } from '@/lib/scraper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const force = body?.force === true;
    const result = await scrapeAll(force);
    return NextResponse.json(result);
  } catch (err) {
    console.error('Error scraping:', err);
    return NextResponse.json({ error: 'Falha ao buscar dados' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

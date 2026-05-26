import { NextRequest, NextResponse } from 'next/server';
import { getScrapeMetaValue, setScrapeMetaValue } from '@/lib/db';
import { scrapeAll } from '@/lib/scraper';

function isAuthenticated(request: NextRequest): boolean {
  const session = request.cookies.get('admin_session')?.value;
  return session === 'authenticated';
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthenticated(request)) {
      return NextResponse.json({ error: 'Não autorizado!' }, { status: 401 });
    }

    const { force } = await request.json().catch(() => ({ force: false }));
    const currentStatus = getScrapeMetaValue('sync_status');

    if (currentStatus === 'running') {
      return NextResponse.json({ error: 'Sincronização já está em andamento!' }, { status: 400 });
    }

    // Define estado inicial no banco SQLite
    setScrapeMetaValue('sync_status', 'running');
    setScrapeMetaValue('sync_processed_games', '0');
    setScrapeMetaValue('sync_total_games', '0');
    setScrapeMetaValue('sync_current_game', 'Iniciando...');
    setScrapeMetaValue('sync_progress_pct', '0');

    // Executa o scraping em background no servidor sem dar await na resposta HTTP
    scrapeAll(force).catch((err: unknown) => {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('Erro na sincronização disparada pelo admin:', err);
      setScrapeMetaValue('sync_status', 'failed');
      setScrapeMetaValue('sync_last_error', errMsg);
    });

    return NextResponse.json({ success: true, message: 'Sincronização iniciada com sucesso em background!' });
  } catch (err) {
    console.error('Error in POST /api/admin/sync:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

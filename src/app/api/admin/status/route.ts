import { NextRequest, NextResponse } from 'next/server';
import { getAdminStats } from '@/lib/db';

function isAuthenticated(request: NextRequest): boolean {
  const session = request.cookies.get('admin_session')?.value;
  return session === 'authenticated';
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthenticated(request)) {
      return NextResponse.json({ error: 'Não autorizado!' }, { status: 401 });
    }

    const stats = getAdminStats();
    return NextResponse.json({ stats });
  } catch (err) {
    console.error('Error in GET /api/admin/status:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

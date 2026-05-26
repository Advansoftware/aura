import { NextRequest, NextResponse } from 'next/server';
import { getScrapeMetaValue, setScrapeMetaValue } from '@/lib/db';

function isAuthenticated(request: NextRequest): boolean {
  const session = request.cookies.get('admin_session')?.value;
  return session === 'authenticated';
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthenticated(request)) {
      return NextResponse.json({ error: 'Não autorizado!' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Dados incompletos!' }, { status: 400 });
    }

    // Obtém a senha atual cadastrada
    const savedPassword = getScrapeMetaValue('admin_password');
    const activePassword = savedPassword || process.env.ADMIN_PASSWORD || 'admin123';

    // Valida a senha atual
    if (currentPassword !== activePassword) {
      return NextResponse.json({ error: 'Senha atual incorreta!' }, { status: 401 });
    }

    if (newPassword.length < 4) {
      return NextResponse.json({ error: 'A nova senha deve ter no mínimo 4 caracteres!' }, { status: 400 });
    }

    // Salva a nova senha de forma persistente no SQLite
    setScrapeMetaValue('admin_password', newPassword);

    return NextResponse.json({ success: true, message: 'Senha alterada com sucesso!' });
  } catch (err) {
    console.error('Error in POST /api/admin/change-password:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

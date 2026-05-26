import { NextRequest, NextResponse } from 'next/server';
import { getScrapeMetaValue } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const savedPassword = getScrapeMetaValue('admin_password');
    const adminPassword = savedPassword || process.env.ADMIN_PASSWORD || 'admin123';

    if (password === adminPassword) {
      const response = NextResponse.json({ success: true, message: 'Autenticado com sucesso!' });
      
      // Define cookie seguro de sessão por 7 dias
      response.cookies.set('admin_session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 7 dias
        path: '/',
      });

      return response;
    }

    return NextResponse.json({ error: 'Senha incorreta!' }, { status: 401 });
  } catch (err) {
    console.error('Error in POST /api/admin/login:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

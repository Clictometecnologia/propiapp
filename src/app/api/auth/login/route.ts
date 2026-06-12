import { NextResponse } from 'next/server';
import { signToken, getAdminCredentials } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });
    }

    const creds = getAdminCredentials();
    if (!creds) {
      return NextResponse.json({ error: 'Auth no configurado' }, { status: 500 });
    }

    const emailMatch = email.toLowerCase().trim() === creds.email.toLowerCase().trim();
    const passwordMatch = password === creds.password;

    if (!emailMatch || !passwordMatch) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const token = await signToken({ email: creds.email, role: 'admin' });

    const response = NextResponse.json({ success: true });
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

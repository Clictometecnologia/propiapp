import { NextResponse } from 'next/server';
import { signToken, getAdminCredentials } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });
    }

    const creds = getAdminCredentials();
    if (!creds) {
      console.error('ADMIN_EMAIL or ADMIN_PASSWORD not set on server');
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
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

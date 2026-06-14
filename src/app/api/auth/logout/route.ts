import { NextResponse } from 'next/server';
import { validateOrigin } from '@/lib/csrf';

export async function POST() {
  if (!(await validateOrigin())) {
    return NextResponse.json({ error: 'Origen no válido' }, { status: 403 });
  }
  const response = NextResponse.json({ success: true });
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}

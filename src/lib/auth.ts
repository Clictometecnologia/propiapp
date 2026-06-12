import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'fallback-dev-secret-change-in-production-32chars');
const issuer = 'propiapp';
const expiresIn = '7d';

export interface AuthPayload {
  email: string;
  role: 'admin';
}

export async function signToken(payload: AuthPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(issuer)
    .setExpirationTime(expiresIn)
    .setIssuedAt()
    .sign(secret);
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret, { issuer });
    return payload as unknown as AuthPayload;
  } catch {
    return null;
  }
}

export interface AdminUser {
  email: string;
  password: string;
}

export function getAdminUsers(): AdminUser[] {
  const raw = process.env.ADMIN_CREDENTIALS;
  if (!raw) {
    console.warn('ADMIN_CREDENTIALS not set');
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(u => u.email && u.password);
  } catch {
    console.error('ADMIN_CREDENTIALS is not valid JSON');
    return [];
  }
}

import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

if (!process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET environment variable is required');
}
const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
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
  passwordHash?: string;
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

export async function verifyPassword(plainPassword: string, storedPassword: string): Promise<boolean> {
  if (storedPassword.startsWith('$2')) {
    return bcrypt.compare(plainPassword, storedPassword);
  }
  return plainPassword === storedPassword;
}

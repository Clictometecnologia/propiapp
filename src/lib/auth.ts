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

export function getAdminCredentials() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn('ADMIN_EMAIL or ADMIN_PASSWORD not set');
    return null;
  }
  return { email, password };
}

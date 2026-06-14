import { headers } from 'next/headers';

export async function validateOrigin(): Promise<boolean> {
  const hdrs = await headers();
  const origin = hdrs.get('origin');
  const host = hdrs.get('host');
  const forwardedHost = hdrs.get('x-forwarded-host');

  if (!origin) return true;

  const allowedHost = forwardedHost || host;
  if (!allowedHost) return false;

  try {
    const originUrl = new URL(origin);
    return originUrl.host === allowedHost;
  } catch {
    return false;
  }
}

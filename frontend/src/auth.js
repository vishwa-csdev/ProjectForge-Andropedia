import { createAuthClient } from '@neondatabase/neon-js/auth';

const authUrl = import.meta.env.VITE_NEON_AUTH_URL;

export const neonAuth = authUrl ? createAuthClient(authUrl) : null;

export async function getNeonAccessToken() {
  if (!neonAuth) return null;

  const result = await neonAuth.getSession();
  return result.data?.session?.access_token || null;
}

export async function requestNeonPasswordReset(email) {
  if (!neonAuth) return null;
  return neonAuth.requestPasswordReset({
    email,
    redirectTo: `${window.location.origin}/reset-password`,
  });
}
import axios from 'axios';

type FirebaseRefreshResponse = {
  id_token: string;
  refresh_token: string;
  expires_in: string;
  user_id: string;
};

/**
 * Exchanges a Firebase refresh token for a new ID token via Google's secure token endpoint.
 * Returns null when no API key is configured or the refresh fails, signalling the caller to sign out.
 */
export async function refreshFirebaseToken(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string; uid: string } | null> {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (!apiKey || !refreshToken) return null;

  try {
    const { data } = await axios.post<FirebaseRefreshResponse>(
      `https://securetoken.googleapis.com/v1/token?key=${apiKey}`,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
    return {
      accessToken: data.id_token,
      refreshToken: data.refresh_token,
      uid: data.user_id,
    };
  } catch {
    return null;
  }
}

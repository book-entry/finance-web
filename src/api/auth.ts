import { apiClient } from './client';

export type OAuthProviderId = 'google' | 'apple';

export type OAuthLoginResponse = {
  accessToken: string;
  refreshToken: string;
  uid: string;
  displayName: string | null;
  isNewUser: boolean;
};

const base = '/authentication/v1';

export const authApi = {
  /**
   * Exchanges a provider (Google / Apple) ID token for Firebase ID/refresh
   * tokens. The backend creates the account on first sign-in (isNewUser=true).
   */
  oauthLogin: async (provider: OAuthProviderId, idToken: string) => {
    const { data } = await apiClient.post<OAuthLoginResponse>(`${base}/login/oauth`, {
      provider,
      idToken,
    });
    return data;
  },
};

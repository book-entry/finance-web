import { apiClient } from './client';

/**
 * Mirrors `MeResponse` on `finance-authentication` (P1 lean scope, see
 * REQ-settings-backend §3). All fields are sourced live from Firebase —
 * the auth service has no relational DB yet, so timezone / locale /
 * photoUrl are not part of the response.
 *
 * `createdAt` and `lastSignInAt` are UTC ISO-8601; render in the user's
 * local timezone client-side. `lastSignInAt` is `null` for users who have
 * never signed in (theoretically the never-completed-OTP edge case).
 */
export type Me = {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName: string | null;
  createdAt: string;
  lastSignInAt: string | null;
};

/** Editable subset of {@link Me}. Empty/blank/over-length → 400. */
export type UpdateMeInput = {
  displayName?: string;
};

const base = '/authentication/v1/me';

export const meApi = {
  get: async (): Promise<Me> => {
    const { data } = await apiClient.get<Me>(base);
    return data;
  },
  patch: async (input: UpdateMeInput): Promise<Me> => {
    const { data } = await apiClient.patch<Me>(base, input);
    return data;
  },
};

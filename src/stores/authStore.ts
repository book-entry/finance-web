import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Session = {
  accessToken: string;
  refreshToken: string;
  uid: string;
};

type AuthState = {
  session: Session | null;
  setSession: (session: Session) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
    }),
    { name: 'splitwallet:auth' },
  ),
);

export function isAuthenticated(): boolean {
  return useAuthStore.getState().session !== null;
}

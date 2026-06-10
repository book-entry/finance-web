import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore, isAuthenticated } from './authStore';

const SAMPLE = {
  accessToken: 'access.tok',
  refreshToken: 'refresh.tok',
  uid: 'uid-1',
};

beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ session: null });
});

describe('authStore', () => {
  it('starts unauthenticated', () => {
    expect(useAuthStore.getState().session).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });

  it('stores and reports a session', () => {
    useAuthStore.getState().setSession(SAMPLE);
    expect(useAuthStore.getState().session).toEqual(SAMPLE);
    expect(isAuthenticated()).toBe(true);
  });

  it('clears the session', () => {
    useAuthStore.getState().setSession(SAMPLE);
    useAuthStore.getState().clearSession();
    expect(useAuthStore.getState().session).toBeNull();
  });

  it('persists the session to localStorage', () => {
    useAuthStore.getState().setSession(SAMPLE);
    const raw = localStorage.getItem('splitwallet:auth');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!).state.session).toEqual(SAMPLE);
  });
});

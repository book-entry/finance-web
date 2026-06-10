import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { useAuthStore } from '../../stores/authStore';
import { AuthScreen } from './AuthScreen';

// Avoid initializing the real Firebase app (which needs env config) in tests.
vi.mock('../../lib/firebase', () => ({
  firebaseAuth: {},
  googleProvider: { id: 'google' },
  appleProvider: { id: 'apple' },
}));

vi.mock('firebase/auth', () => ({
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: { credentialFromResult: vi.fn() },
  getAdditionalUserInfo: vi.fn(),
}));

vi.mock('../../api/auth', () => ({
  authApi: { oauthLogin: vi.fn() },
}));

vi.mock('../../api/me', () => ({
  meApi: { patch: vi.fn() },
}));

import { signInWithPopup, GoogleAuthProvider, getAdditionalUserInfo } from 'firebase/auth';
import { authApi } from '../../api/auth';
import { meApi } from '../../api/me';

const mockedSignIn = signInWithPopup as unknown as ReturnType<typeof vi.fn>;
const mockedGoogleCred = GoogleAuthProvider.credentialFromResult as unknown as ReturnType<typeof vi.fn>;
const mockedAdditionalInfo = getAdditionalUserInfo as unknown as ReturnType<typeof vi.fn>;
const mockedOauthLogin = authApi.oauthLogin as unknown as ReturnType<typeof vi.fn>;
const mockedPatchMe = meApi.patch as unknown as ReturnType<typeof vi.fn>;

function renderAuth(initial: '/sign-in' | '/sign-up' = '/sign-in') {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const signIn = createRoute({
    getParentRoute: () => rootRoute,
    path: '/sign-in',
    component: () => <AuthScreen mode="signin" />,
  });
  const signUp = createRoute({
    getParentRoute: () => rootRoute,
    path: '/sign-up',
    component: () => <AuthScreen mode="signup" />,
  });
  const home = createRoute({
    getParentRoute: () => rootRoute,
    path: '/transactions',
    component: () => <div>POST_AUTH_HOME</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([signIn, signUp, home]),
    history: createMemoryHistory({ initialEntries: [initial] }),
  });
  return render(<RouterProvider router={router} />);
}

beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ session: null });
  mockedSignIn.mockReset();
  mockedGoogleCred.mockReset();
  mockedAdditionalInfo.mockReset();
  mockedOauthLogin.mockReset();
  mockedPatchMe.mockReset();
});

describe('<AuthScreen mode="signin" />', () => {
  it('shows the sign-in headline and the Google button', async () => {
    renderAuth('/sign-in');
    expect(await screen.findByText('back.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
  });

  it('runs the full Google OAuth → backend exchange → post-auth landing flow', async () => {
    mockedSignIn.mockResolvedValueOnce({ user: { uid: 'u-1', displayName: 'Ryan' } });
    mockedGoogleCred.mockReturnValueOnce({ idToken: 'google-id-token' });
    mockedAdditionalInfo.mockReturnValueOnce({ isNewUser: false });
    mockedOauthLogin.mockResolvedValueOnce({
      accessToken: 'acc',
      refreshToken: 'ref',
      uid: 'u-1',
      displayName: 'Ryan',
      isNewUser: false,
    });

    const user = userEvent.setup();
    renderAuth('/sign-in');

    await user.click(await screen.findByRole('button', { name: /google/i }));

    await waitFor(() => {
      expect(mockedOauthLogin).toHaveBeenCalledWith('google', 'google-id-token');
      expect(useAuthStore.getState().session).toEqual({
        accessToken: 'acc',
        refreshToken: 'ref',
        uid: 'u-1',
      });
    });
    expect(await screen.findByText('POST_AUTH_HOME')).toBeInTheDocument();
  });

  it('prompts a first-time user for a name, saves it to Firebase, then lands', async () => {
    mockedSignIn.mockResolvedValueOnce({ user: { uid: 'u-new', displayName: 'From Google' } });
    mockedGoogleCred.mockReturnValueOnce({ idToken: 'google-id-token' });
    mockedAdditionalInfo.mockReturnValueOnce({ isNewUser: true });
    mockedOauthLogin.mockResolvedValueOnce({
      accessToken: 'a',
      refreshToken: 'r',
      uid: 'u-new',
      displayName: 'From Google',
      isNewUser: true,
    });
    mockedPatchMe.mockResolvedValueOnce({
      uid: 'u-new',
      email: 'new@home.hk',
      emailVerified: true,
      displayName: 'Ryan',
      createdAt: '2026-06-10T00:00:00Z',
      lastSignInAt: null,
    });

    const user = userEvent.setup();
    renderAuth('/sign-in');

    await user.click(await screen.findByRole('button', { name: /google/i }));

    // Session is stored immediately; we just don't land yet.
    await waitFor(() =>
      expect(useAuthStore.getState().session).toEqual({
        accessToken: 'a',
        refreshToken: 'r',
        uid: 'u-new',
      }),
    );
    expect(screen.queryByText('POST_AUTH_HOME')).not.toBeInTheDocument();

    // The provider-supplied name pre-fills the field; the user can change it.
    const input = (await screen.findByLabelText('Your name')) as HTMLInputElement;
    expect(input.value).toBe('From Google');
    await user.clear(input);
    await user.type(input, 'Ryan');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => expect(mockedPatchMe).toHaveBeenCalledWith({ displayName: 'Ryan' }));
    expect(await screen.findByText('POST_AUTH_HOME')).toBeInTheDocument();
  });

  it('stays silent when the user dismisses the provider popup', async () => {
    mockedSignIn.mockRejectedValueOnce({ code: 'auth/popup-closed-by-user' });

    const user = userEvent.setup();
    renderAuth('/sign-in');

    await user.click(await screen.findByRole('button', { name: /google/i }));

    await waitFor(() => expect(mockedSignIn).toHaveBeenCalledTimes(1));
    expect(mockedOauthLogin).not.toHaveBeenCalled();
    expect(useAuthStore.getState().session).toBeNull();
    expect(
      screen.queryByText(/Could not sign in with Google/i),
    ).not.toBeInTheDocument();
  });

  it('surfaces a friendly error when the backend rejects the credential', async () => {
    const { ApiError } = await import('../../api/types');
    mockedSignIn.mockResolvedValueOnce({ user: { uid: 'u-1' } });
    mockedGoogleCred.mockReturnValueOnce({ idToken: 'google-id-token' });
    mockedOauthLogin.mockRejectedValueOnce(
      new ApiError({ code: 'INVALID_ID_TOKEN', message: 'nope', status: 401 }),
    );

    const user = userEvent.setup();
    renderAuth('/sign-in');

    await user.click(await screen.findByRole('button', { name: /google/i }));

    expect(
      await screen.findByText('Sign-in could not be verified. Please try again.'),
    ).toBeInTheDocument();
    expect(useAuthStore.getState().session).toBeNull();
  });

  it('switches to sign-up when the footer link is clicked', async () => {
    const user = userEvent.setup();
    renderAuth('/sign-in');
    await user.click(await screen.findByRole('button', { name: /create an account/i }));
    expect(await screen.findByText('make sense.')).toBeInTheDocument();
  });
});

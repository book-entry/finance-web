import { useState } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  getAdditionalUserInfo,
  type AuthError,
} from 'firebase/auth';
import { firebaseAuth, googleProvider } from '../../lib/firebase';
import { authApi, type OAuthLoginResponse } from '../../api/auth';
import { ApiError } from '../../api/types';

function GoogleLogo() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.6 12.2c0-.8-.1-1.6-.2-2.4H12v4.5h6c-.3 1.4-1 2.6-2.2 3.4v2.8h3.6c2.1-2 3.2-4.8 3.2-8.3z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.6-2.8c-1 .7-2.3 1.1-3.6 1.1-2.8 0-5.1-1.9-6-4.4H2.4v2.8C4.2 20.6 7.9 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M6 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.9H2.4C1.5 8.4 1 10.1 1 12s.5 3.6 1.4 5.1L6 14.3z"
      />
      <path
        fill="#EA4335"
        d="M12 5.5c1.6 0 3 .5 4.1 1.6l3.1-3.1C17.4 2.1 14.9 1 12 1 7.9 1 4.2 3.4 2.4 6.9L6 9.7c.9-2.5 3.2-4.2 6-4.2z"
      />
    </svg>
  );
}

type SocialButtonsProps = {
  onError: (message: string | null) => void;
  /** Called with the backend's OAuth response once sign-in succeeds. The
   * parent owns session storage + post-auth routing (incl. the new-user
   * name step). */
  onAuthenticated: (response: OAuthLoginResponse) => void;
};

// Apple ("Sign in with Apple") is intentionally not wired up in the UI yet — it
// needs an Apple Developer Services ID configured in Firebase. The backend still
// accepts provider="apple" and `appleProvider` still exists in lib/firebase, so
// re-enabling is a small frontend change: add an Apple button that calls
// signInWithPopup(firebaseAuth, appleProvider) and reads the token via
// OAuthProvider.credentialFromResult(result)?.idToken.
export function SocialButtons({ onError, onAuthenticated }: SocialButtonsProps) {
  const [busy, setBusy] = useState(false);

  const signInWithGoogle = async () => {
    if (busy) return;
    onError(null);
    setBusy(true);
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = GoogleAuthProvider.credentialFromResult(result)?.idToken;
      if (!idToken) {
        throw new Error('No ID token returned by the provider.');
      }
      const response = await authApi.oauthLogin('google', idToken);
      // The client popup is the source of truth for "first sign-in": it creates
      // the Firebase account before the backend's signInWithIdp runs, so the
      // backend always reports isNewUser=false. Read it from the popup result,
      // and prefer the provider-supplied name to pre-fill the name step.
      const isNewUser = getAdditionalUserInfo(result)?.isNewUser ?? false;
      onAuthenticated({
        ...response,
        isNewUser,
        displayName: result.user.displayName ?? response.displayName,
      });
    } catch (err) {
      onError(messageFor(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        type="button"
        className="btn"
        style={{ flex: 1, justifyContent: 'center' }}
        onClick={signInWithGoogle}
        disabled={busy}
      >
        <GoogleLogo /> {busy ? 'Connecting…' : 'Continue with Google'}
      </button>
    </div>
  );
}

function messageFor(err: unknown): string | null {
  // User dismissed the popup or started another one — not an error worth showing.
  const code = (err as AuthError | undefined)?.code;
  if (
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request' ||
    code === 'auth/user-cancelled'
  ) {
    return null;
  }
  if (code === 'auth/popup-blocked') {
    return 'Your browser blocked the sign-in popup. Allow popups and try again.';
  }
  if (code === 'auth/account-exists-with-different-credential') {
    return 'An account already exists with this email using a different sign-in method.';
  }
  if (err instanceof ApiError) {
    if (err.code === 'INVALID_ID_TOKEN') {
      return 'Sign-in could not be verified. Please try again.';
    }
    return err.message;
  }
  return 'Could not sign in with Google. Please try again.';
}

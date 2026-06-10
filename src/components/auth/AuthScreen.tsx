import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Brand } from '../shell/Brand';
import { AuthArt } from './AuthArt';
import { SocialButtons } from './SocialButtons';
import { meApi } from '../../api/me';
import { ApiError } from '../../api/types';
import { useAuthStore } from '../../stores/authStore';
import type { OAuthLoginResponse } from '../../api/auth';
import './auth.css';

type AuthScreenProps = {
  mode: 'signin' | 'signup';
};

type Step = { kind: 'providers' } | { kind: 'name' };

const DISPLAY_NAME_MAX = 60;

export function AuthScreen({ mode }: AuthScreenProps) {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const [step, setStep] = useState<Step>({ kind: 'providers' });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const switchMode = () => {
    setErrorMessage(null);
    navigate({ to: mode === 'signin' ? '/sign-up' : '/sign-in' });
  };

  // SocialButtons hands us the backend response. We're authenticated either
  // way, so store the session first. On a brand-new account, collect a name
  // before landing; returning users go straight in.
  const handleAuthenticated = (res: OAuthLoginResponse) => {
    setSession({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      uid: res.uid,
    });
    if (res.isNewUser) {
      setName(res.displayName ?? '');
      setErrorMessage(null);
      setStep({ kind: 'name' });
    } else {
      navigate({ to: '/transactions' });
    }
  };

  const submitName = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (savingName || !trimmed) return;
    setErrorMessage(null);
    setSavingName(true);
    try {
      await meApi.patch({ displayName: trimmed });
      navigate({ to: '/transactions' });
    } catch (err) {
      setErrorMessage(nameErrorFor(err));
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-form-wrap">
        <div className="auth-form">
          <Brand />
          <div style={{ marginTop: 36 }}>
            {step.kind === 'providers' ? (
              <>
                <h1>
                  {mode === 'signin' ? (
                    <>
                      Welcome <em>back.</em>
                    </>
                  ) : (
                    <>
                      Make money <em>make sense.</em>
                    </>
                  )}
                </h1>
                <div className="sub">
                  {mode === 'signin'
                    ? 'Sign in with Google to track what you and your partner spend.'
                    : 'Create your account with Google — a shared inbox for every transaction in your household.'}
                </div>

                {errorMessage ? (
                  <div className="auth-error" style={{ marginTop: 18 }}>
                    {errorMessage}
                  </div>
                ) : null}

                <div style={{ marginTop: 24 }}>
                  <SocialButtons onError={setErrorMessage} onAuthenticated={handleAuthenticated} />
                </div>

                <div className="auth-footer">
                  {mode === 'signin' ? (
                    <>
                      New here?{' '}
                      <button type="button" className="field-link" onClick={switchMode}>
                        Create an account
                      </button>
                    </>
                  ) : (
                    <>
                      Have an account?{' '}
                      <button type="button" className="field-link" onClick={switchMode}>
                        Sign in
                      </button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <form onSubmit={submitName} noValidate>
                <h1>
                  One last <em>thing.</em>
                </h1>
                <div className="sub">What should we call you?</div>

                <div className="field" style={{ marginTop: 24 }}>
                  <label htmlFor="auth-display-name">Your name</label>
                  <input
                    id="auth-display-name"
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ryan Cheung"
                    autoComplete="name"
                    maxLength={DISPLAY_NAME_MAX}
                    autoFocus
                    required
                  />
                </div>

                {errorMessage ? (
                  <div className="auth-error" style={{ marginTop: 14 }}>
                    {errorMessage}
                  </div>
                ) : null}

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 18 }}
                  disabled={savingName || name.trim().length === 0}
                >
                  {savingName ? 'Saving…' : 'Continue'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      <AuthArt />
    </div>
  );
}

function nameErrorFor(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === 'INVALID_INPUT') {
      return `Please enter a name between 1 and ${DISPLAY_NAME_MAX} characters.`;
    }
    return err.message;
  }
  return 'Could not save your name. Please try again.';
}

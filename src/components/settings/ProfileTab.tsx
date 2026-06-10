import { useEffect, useState } from 'react';
import { message } from 'antd';
import { useMe, useUpdateMe } from '../../hooks/queries/useMe';
import { ApiError } from '../../api/types';

const MAX_NAME = 60;

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function ProfileTab() {
  const meQuery = useMe();
  const updateMe = useUpdateMe();

  const me = meQuery.data;
  const [displayName, setDisplayName] = useState('');
  const [touched, setTouched] = useState(false);

  // Reset the local draft whenever the server snapshot changes.
  useEffect(() => {
    if (me) setDisplayName(me.displayName ?? '');
  }, [me?.displayName]);

  if (meQuery.isLoading) {
    return <ProfileSkeleton />;
  }
  if (meQuery.isError || !me) {
    return (
      <div className="settings-card">
        <div
          style={{
            padding: 12,
            color: 'var(--danger)',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <span>Couldn't load profile.</span>
          <button
            type="button"
            className="btn"
            onClick={() => void meQuery.refetch()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const trimmed = displayName.trim();
  const isDirty = trimmed !== (me.displayName ?? '');
  const validation = validate(displayName);
  const canSave = isDirty && validation.ok && !updateMe.isPending;

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    try {
      await updateMe.mutateAsync({ displayName: trimmed });
      message.success('Profile updated');
      setTouched(false);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Could not save profile';
      message.error(msg);
    }
  };

  return (
    <div className="settings-two-col">
      <form className="settings-card" onSubmit={onSubmit}>
        <h3>Profile</h3>

        <div className="settings-field">
          <label htmlFor="displayName">Display name</label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            maxLength={MAX_NAME + 8 /* leave headroom for paste-then-trim */}
            onChange={(e) => {
              setDisplayName(e.target.value);
              setTouched(true);
            }}
          />
          {touched && !validation.ok ? (
            <div className="error">{validation.reason}</div>
          ) : (
            <div className="hint">
              How you appear in greetings and shared workspaces. 1–
              {MAX_NAME} characters.
            </div>
          )}
        </div>

        <div className="settings-field">
          <label>Email</label>
          <div className="value-readonly">
            {me.email}
            <span className="meta">
              {me.emailVerified ? 'Verified' : 'Not verified'}
            </span>
          </div>
          <div className="hint">
            Changing your email needs a credential flow — coming soon.
          </div>
        </div>

        <div className="settings-form-actions">
          <button
            type="button"
            className="btn"
            disabled={!isDirty || updateMe.isPending}
            onClick={() => {
              setDisplayName(me.displayName ?? '');
              setTouched(false);
            }}
          >
            Reset
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!canSave}
          >
            {updateMe.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>

      <div className="settings-card">
        <h3>Account</h3>
        <div className="settings-field">
          <label>User ID</label>
          <div
            className="value-readonly"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
          >
            {me.uid}
          </div>
        </div>
        <div className="settings-field">
          <label>Joined</label>
          <div className="value-readonly">{formatDate(me.createdAt)}</div>
        </div>
        <div className="settings-field">
          <label>Last sign-in</label>
          <div className="value-readonly">{formatDate(me.lastSignInAt)}</div>
        </div>
      </div>
    </div>
  );
}

function validate(raw: string): { ok: boolean; reason?: string } {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { ok: false, reason: 'Display name cannot be empty.' };
  }
  if (trimmed.length > MAX_NAME) {
    return { ok: false, reason: `Display name is too long (max ${MAX_NAME}).` };
  }
  return { ok: true };
}

function ProfileSkeleton() {
  return (
    <div className="settings-two-col">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="settings-skeleton-card">
          <span className="dash-skeleton" style={{ width: 100, height: 16 }}>
            &nbsp;
          </span>
          <span className="dash-skeleton" style={{ width: '100%', height: 42 }}>
            &nbsp;
          </span>
          <span className="dash-skeleton" style={{ width: '100%', height: 42 }}>
            &nbsp;
          </span>
        </div>
      ))}
    </div>
  );
}

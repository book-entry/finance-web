import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { signOut } from 'firebase/auth';
import { Brand } from './Brand';
import { WORKSPACE_NAV, ACCOUNT_NAV, NavIcon, type NavItem } from './navConfig';
import { useMe } from '../../hooks/queries/useMe';
import { merchantInitials } from '../../lib/merchantColor';
import { firebaseAuth } from '../../lib/firebase';
import { useAuthStore } from '../../stores/authStore';

function isActive(pathname: string, itemPath: string): boolean {
  if (itemPath === '/') return pathname === '/';
  return pathname === itemPath || pathname.startsWith(itemPath + '/');
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const IconComp = NavIcon[item.icon];
  return (
    <Link
      to={item.path}
      className={'nav-item' + (isActive(pathname, item.path) ? ' active' : '')}
    >
      <IconComp />
      <span>{item.label}</span>
      {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
    </Link>
  );
}

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((s) => s.clearSession);
  const me = useMe();
  const displayName = me.data?.displayName?.trim() ?? null;
  const email = me.data?.email ?? null;
  const initials = displayName ? merchantInitials(displayName) : '·';

  const handleLogout = async () => {
    // Best-effort Firebase sign-out so the next sign-in re-prompts; the local
    // session + cached data are what actually gate the app, so clear those
    // regardless of whether the Firebase call succeeds.
    try {
      await signOut(firebaseAuth);
    } catch {
      // ignore — clearing the local session below is sufficient to log out.
    }
    clearSession();
    queryClient.clear();
    navigate({ to: '/sign-in' });
  };

  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <Brand />
      <div className="nav-section">Workspace</div>
      {WORKSPACE_NAV.map((item) => (
        <NavLink key={item.id} item={item} pathname={pathname} />
      ))}
      <div className="nav-section">Account</div>
      {ACCOUNT_NAV.map((item) => (
        <NavLink key={item.id} item={item} pathname={pathname} />
      ))}
      <div className="spacer" />
      <div className="user-card">
        <Link to="/settings" className="user-link" aria-label="Open settings">
          <div className="avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {displayName ?? (me.isLoading ? '…' : 'Signed in')}
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-dim)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {email ?? ''}
            </div>
          </div>
        </Link>
        <button
          type="button"
          className="user-logout-btn"
          onClick={handleLogout}
          title="Sign out"
          aria-label="Sign out"
        >
          <NavIcon.LogOut />
        </button>
      </div>
    </aside>
  );
}

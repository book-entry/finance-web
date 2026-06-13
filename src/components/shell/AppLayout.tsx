import { useEffect, useState } from 'react';
import { Outlet, useRouterState } from '@tanstack/react-router';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { Brand } from './Brand';
import { Icon } from '../icons/Icon';
import { usePrefsStore } from '../../stores/prefsStore';
import './shell.css';

export function AppLayout() {
  const layout = usePrefsStore((s) => s.layout);
  const [navOpen, setNavOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Close the mobile drawer on navigation so it never lingers over content.
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  // Lock background scroll and allow Escape to dismiss while the drawer is open.
  useEffect(() => {
    if (!navOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [navOpen]);

  if (layout === 'topnav') {
    return (
      <div style={{ minHeight: '100vh' }}>
        <TopNav />
        <main className="main">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="mobile-header">
        <button
          type="button"
          className="icon-btn mobile-menu-btn"
          aria-label="Open navigation menu"
          aria-expanded={navOpen}
          onClick={() => setNavOpen(true)}
        >
          <Icon.Menu />
        </button>
        <Brand />
      </header>
      <Sidebar
        className={navOpen ? 'open' : ''}
        onNavigate={() => setNavOpen(false)}
      />
      <div
        className={'shell-scrim' + (navOpen ? ' show' : '')}
        onClick={() => setNavOpen(false)}
        aria-hidden="true"
      />
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

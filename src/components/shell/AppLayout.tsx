import { Outlet } from '@tanstack/react-router';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { usePrefsStore } from '../../stores/prefsStore';
import './shell.css';

export function AppLayout() {
  const layout = usePrefsStore((s) => s.layout);

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
      <Sidebar />
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

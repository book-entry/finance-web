import { Link, useRouterState } from '@tanstack/react-router';
import { Brand } from './Brand';
import { FULL_NAV, NavIcon } from './navConfig';
import { Icon } from '../icons/Icon';

function isActive(pathname: string, itemPath: string): boolean {
  return pathname === itemPath || pathname.startsWith(itemPath + '/');
}

export function TopNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="topnav" aria-label="Primary navigation">
      <Brand />
      <div className="nav-row">
        {FULL_NAV.map((item) => {
          const IconComp = NavIcon[item.icon];
          return (
            <Link
              key={item.id}
              to={item.path}
              className={'nav-item' + (isActive(pathname, item.path) ? ' active' : '')}
            >
              <IconComp />
              <span>{item.label}</span>
              {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
            </Link>
          );
        })}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button type="button" className="icon-btn" aria-label="Notifications">
          <Icon.Bell />
        </button>
        <div className="avatar" aria-label="Account menu">
          RC
        </div>
      </div>
    </div>
  );
}

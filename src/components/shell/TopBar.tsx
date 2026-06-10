import type { ReactNode } from 'react';
import { Icon } from '../icons/Icon';

type TopBarProps = {
  title: string;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
  hideSearch?: boolean;
};

export function TopBar({ title, breadcrumb, actions, hideSearch }: TopBarProps) {
  return (
    <div className="topbar">
      <div>
        {breadcrumb ? <div className="breadcrumb">{breadcrumb}</div> : null}
        <h1>{title}</h1>
      </div>
      <div className="spacer" />
      {hideSearch ? null : (
        <div className="search">
          <Icon.Search />
          <input placeholder="Search transactions, merchants…" />
        </div>
      )}
      <button type="button" className="icon-btn" aria-label="Notifications">
        <Icon.Bell />
      </button>
      {actions}
    </div>
  );
}

import type { ReactNode } from 'react';

export function SettingRow({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <div className="settings-row">
      <div className="row-body">
        <div className="row-title">{title}</div>
        {desc ? <div className="row-desc">{desc}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function Toggle({
  on,
  onChange,
  ariaLabel,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={ariaLabel}
      className={'settings-toggle' + (on ? ' on' : '')}
      onClick={() => onChange(!on)}
    />
  );
}

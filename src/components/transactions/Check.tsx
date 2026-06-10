import { Icon } from '../icons/Icon';

type CheckProps = {
  on: boolean;
  indeterminate?: boolean;
  onChange: (next: boolean) => void;
  ariaLabel?: string;
};

export function Check({ on, indeterminate, onChange, ariaLabel }: CheckProps) {
  const cls =
    'check' + (on ? ' on' : '') + (indeterminate && !on ? ' indeterminate' : '');
  return (
    <span
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : on}
      aria-label={ariaLabel}
      tabIndex={0}
      className={cls}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!on);
      }}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onChange(!on);
        }
      }}
    >
      {on ? <Icon.Check /> : null}
    </span>
  );
}

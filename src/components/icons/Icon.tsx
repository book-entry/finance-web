import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const Icon = {
  Dashboard: (p: IconProps) => (
    <svg {...base(18)} strokeWidth={1.8} {...p}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  Transactions: (p: IconProps) => (
    <svg {...base(18)} strokeWidth={1.8} {...p}>
      <path d="M3 7h13l-3-3" />
      <path d="M21 17H8l3 3" />
    </svg>
  ),
  Banks: (p: IconProps) => (
    <svg {...base(18)} strokeWidth={1.8} {...p}>
      <path d="M3 10l9-6 9 6" />
      <path d="M5 10v9" />
      <path d="M19 10v9" />
      <path d="M9 10v9" />
      <path d="M15 10v9" />
      <path d="M3 21h18" />
    </svg>
  ),
  Tags: (p: IconProps) => (
    <svg {...base(18)} strokeWidth={1.8} {...p}>
      <path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </svg>
  ),
  Import: (p: IconProps) => (
    <svg {...base(18)} strokeWidth={1.8} {...p}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Reports: (p: IconProps) => (
    <svg {...base(18)} strokeWidth={1.8} {...p}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Settings: (p: IconProps) => (
    <svg {...base(18)} strokeWidth={1.8} {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  ),
  Search: (p: IconProps) => (
    <svg {...base(14)} strokeWidth={2} {...p}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Bell: (p: IconProps) => (
    <svg {...base(16)} strokeWidth={1.8} {...p}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Plus: (p: IconProps) => (
    <svg {...base(16)} strokeWidth={2.2} {...p}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Check: (p: IconProps) => (
    <svg {...base(12)} strokeWidth={3} {...p}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  ChevronRight: (p: IconProps) => (
    <svg {...base(14)} strokeWidth={2} {...p}>
      <polyline points="9 6 15 12 9 18" />
    </svg>
  ),
  ChevronLeft: (p: IconProps) => (
    <svg {...base(14)} strokeWidth={2} {...p}>
      <polyline points="15 6 9 12 15 18" />
    </svg>
  ),
  Down: (p: IconProps) => (
    <svg {...base(12)} strokeWidth={2.4} {...p}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Up: (p: IconProps) => (
    <svg {...base(12)} strokeWidth={2.4} {...p}>
      <polyline points="6 15 12 9 18 15" />
    </svg>
  ),
  X: (p: IconProps) => (
    <svg {...base(16)} strokeWidth={2} {...p}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="18" x2="18" y2="6" />
    </svg>
  ),
  Upload: (p: IconProps) => (
    <svg {...base(22)} strokeWidth={1.8} {...p}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  Sparkles: (p: IconProps) => (
    <svg {...base(14)} strokeWidth={1.8} {...p}>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
      <path d="M19 17l.7 2 2 .7-2 .7L19 23l-.7-2-2-.7 2-.7z" />
    </svg>
  ),
  Mail: (p: IconProps) => (
    <svg {...base(14)} strokeWidth={1.8} {...p}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22 6 12 13 2 6" />
    </svg>
  ),
  Lock: (p: IconProps) => (
    <svg {...base(14)} strokeWidth={1.8} {...p}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  User: (p: IconProps) => (
    <svg {...base(14)} strokeWidth={1.8} {...p}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Eye: (p: IconProps) => (
    <svg {...base(14)} strokeWidth={1.8} {...p}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: (p: IconProps) => (
    <svg {...base(14)} strokeWidth={1.8} {...p}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  LogOut: (p: IconProps) => (
    <svg {...base(14)} strokeWidth={1.8} {...p}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

export type IconKey = keyof typeof Icon;

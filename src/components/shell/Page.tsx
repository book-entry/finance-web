import type { ReactNode } from 'react';

type PageProps = {
  children: ReactNode;
  narrow?: boolean;
};

export function Page({ children, narrow = false }: PageProps) {
  return <div className={'page' + (narrow ? ' page-narrow' : '')}>{children}</div>;
}

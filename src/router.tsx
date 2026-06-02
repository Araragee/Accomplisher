import React, { useSyncExternalStore } from 'react';

// Minimal hash router. No dependency, works inside the Tauri webview without a
// server. Routes look like #/accomplishments.
function getRoute(): string {
  const h = window.location.hash.replace(/^#/, '');
  return h || '/dashboard';
}

function subscribe(cb: () => void): () => void {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

export function useRoute(): string {
  return useSyncExternalStore(subscribe, getRoute);
}

export function navigate(to: string): void {
  if (getRoute() !== to) window.location.hash = to;
}

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  className?: string;
  children: React.ReactNode;
}

export function Link({ to, className, children, ...props }: LinkProps): React.JSX.Element {
  return (
    <a href={`#${to}`} className={className} {...props}>
      {children}
    </a>
  );
}

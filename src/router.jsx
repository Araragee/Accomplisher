import { useSyncExternalStore } from 'react';

// Minimal hash router. No dependency, works inside the Tauri webview without a
// server. Routes look like #/accomplishments.
function getRoute() {
  const h = window.location.hash.replace(/^#/, '');
  return h || '/dashboard';
}

function subscribe(cb) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

export function useRoute() {
  return useSyncExternalStore(subscribe, getRoute);
}

export function navigate(to) {
  if (getRoute() !== to) window.location.hash = to;
}

export function Link({ to, className, children, ...props }) {
  return (
    <a href={`#${to}`} className={className} {...props}>
      {children}
    </a>
  );
}

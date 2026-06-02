import { AppProvider, useApp } from './store/AppContext';
import { ToastProvider, ConfirmProvider } from './components/ui';
import { AppShell } from './components/layout';
import { useRoute } from './router';

import { DashboardPage } from './pages/DashboardPage';
import { AccomplishmentsPage } from './pages/AccomplishmentsPage';
import { WfhPage } from './pages/WfhPage';
import { ThinkerPage } from './pages/ThinkerPage';
import { TeamPage } from './pages/TeamPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';

const ROUTES = {
  '/dashboard': DashboardPage,
  '/accomplishments': AccomplishmentsPage,
  '/wfh': WfhPage,
  '/thinker': ThinkerPage,
  '/team': TeamPage,
  '/history': HistoryPage,
  '/settings': SettingsPage,
};

function BootScreen() {
  return (
    <div className="grid h-screen place-items-center bg-canvas">
      <div className="flex items-center gap-2 text-sm text-muted">
        <span className="size-2 animate-pulse rounded-full bg-accent" />
        Loading your workspace
      </div>
    </div>
  );
}

function Routed() {
  const route = useRoute();
  const { ready } = useApp();
  if (!ready) return <BootScreen />;
  const key = Object.keys(ROUTES).find((r) => route === r || route.startsWith(`${r}/`));
  const PageComponent = ROUTES[key] || DashboardPage;
  return (
    <AppShell>
      <PageComponent />
    </AppShell>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <ConfirmProvider>
          <Routed />
        </ConfirmProvider>
      </ToastProvider>
    </AppProvider>
  );
}

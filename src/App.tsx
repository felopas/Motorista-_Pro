import { Suspense, lazy } from 'react';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { Loader2 } from 'lucide-react';

const Onboarding = lazy(() => import('@/pages/Onboarding').then((m) => ({ default: m.Onboarding })));
const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Register = lazy(() => import('@/pages/Register').then((m) => ({ default: m.Register })));
const History = lazy(() => import('@/pages/History').then((m) => ({ default: m.History })));
const Settings = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })));
const MonthConfigPage = lazy(() => import('@/pages/MonthConfig').then((m) => ({ default: m.MonthConfigPage })));

function PageLoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
    </div>
  );
}

function App() {
  const { user, isLoading, currentView } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  // Se não tem usuário, mostra onboarding
  if (!user) {
    return (
      <Suspense fallback={<PageLoadingFallback />}>
        <Onboarding />
      </Suspense>
    );
  }

  // Renderiza a view atual
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'register':
        return <Register />;
      case 'history':
        return <History />;
      case 'settings':
        return <Settings />;
      case 'monthConfig':
        return <MonthConfigPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Suspense fallback={<PageLoadingFallback />}>
        {renderView()}
      </Suspense>
      {currentView !== 'register' && currentView !== 'monthConfig' && <BottomNav />}
    </div>
  );
}

export default App;

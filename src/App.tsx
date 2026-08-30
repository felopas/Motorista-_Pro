import { useApp } from '@/contexts/AppContext';
import { Onboarding } from '@/pages/Onboarding';
import { Dashboard } from '@/pages/Dashboard';
import { Register } from '@/pages/Register';
import { History } from '@/pages/History';
import { Settings } from '@/pages/Settings';
import { MonthConfigPage } from '@/pages/MonthConfig';
import { BottomNav } from '@/components/BottomNav';
import { Loader2 } from 'lucide-react';

function App() {
  const { user, isLoading, currentView } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  // Se não tem usuário, mostra onboarding
  if (!user) {
    return <Onboarding />;
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
    <div className="min-h-screen bg-slate-900">
      {renderView()}
      {currentView !== 'register' && currentView !== 'monthConfig' && <BottomNav />}
    </div>
  );
}

export default App;

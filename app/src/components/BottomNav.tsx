import { useApp } from '@/contexts/AppContext';
import { Home, PlusCircle, BarChart3, Settings } from 'lucide-react';

export function BottomNav() {
  const { currentView, setCurrentView } = useApp();

  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'history', icon: BarChart3, label: 'Análise' },
    { id: 'register', icon: PlusCircle, label: 'Registrar' },
    { id: 'settings', icon: Settings, label: 'Ajustes' },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 z-50">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as any)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive 
                  ? 'text-emerald-400' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

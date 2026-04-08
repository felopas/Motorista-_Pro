import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { UserProfile, DailyRecord, MonthConfig, ViewType, AppPlataforma } from '@/types';
import { PLATAFORMAS_PADRAO } from '@/types';
import * as storage from '@/lib/storage';
import { calcularMetaDiaria, gerarId } from '@/lib/calculations';

interface AppContextType {
  // User
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  saveUser: (user: UserProfile) => void;

  // Records
  records: DailyRecord[];
  addRecord: (record: DailyRecord) => void;
  updateRecord: (record: DailyRecord) => void;
  deleteRecord: (id: string) => void;
  getRecordByDate: (date: string) => DailyRecord | undefined;
  getRecordsByMonth: (ano: number, mes: number) => DailyRecord[];

  // Month Config
  monthConfig: MonthConfig | null;
  getMonthConfig: (ano: number, mes: number) => MonthConfig | null;
  setMonthConfig: (config: MonthConfig | null) => void;
  saveMonthConfig: (config: MonthConfig) => void;
  hasMonthConfig: (ano: number, mes: number) => boolean;

  // View
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;

  // Date
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;

  // Loading
  isLoading: boolean;

  // Reset
  resetAllData: () => void;

  // Plataformas
  getPlataformasAtivas: () => AppPlataforma[];
  addPlataforma: (nome: string, icone: string, cor: string) => void;
  updatePlataforma: (plataforma: AppPlataforma) => void;
  togglePlataforma: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [monthConfigs, setMonthConfigs] = useState<Record<string, MonthConfig>>({});
  const [currentMonthConfig, setCurrentMonthConfig] = useState<MonthConfig | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      let savedUser = storage.getUser();
      const savedRecords = storage.getRecords();
      const savedMonthConfigs = storage.getAllMonthConfigs();

      // Migração: adicionar plataformas padrão e preço de combustível para usuários antigos
      if (savedUser) {
        let needsSave = false;
        if (!savedUser.plataformas) {
          savedUser.plataformas = [...PLATAFORMAS_PADRAO];
          needsSave = true;
        }
        if (savedUser.precoCombustivel === undefined) {
          savedUser.precoCombustivel = 5.50;
          needsSave = true;
        }
        if (needsSave) storage.saveUser(savedUser);
      }

      if (savedUser) setUser(savedUser);
      if (savedRecords) setRecords(savedRecords);
      if (savedMonthConfigs) setMonthConfigs(savedMonthConfigs);

      const now = new Date();
      const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      if (savedMonthConfigs && savedMonthConfigs[currentKey]) {
        setCurrentMonthConfig(savedMonthConfigs[currentKey]);
      }

      setIsLoading(false);
    };

    loadData();
  }, []);

  const saveUser = (newUser: UserProfile) => {
    setUser(newUser);
    storage.saveUser(newUser);
  };

  const addRecord = (record: DailyRecord) => {
    storage.saveRecord(record);
    setRecords(storage.getRecords());
  };

  const updateRecord = (record: DailyRecord) => {
    storage.saveRecord(record);
    setRecords(storage.getRecords());
  };

  const deleteRecord = (id: string) => {
    storage.deleteRecord(id);
    setRecords(storage.getRecords());
  };

  const getRecordByDate = (date: string) => {
    return records.find(r => r.data === date);
  };

  const getRecordsByMonth = (ano: number, mes: number) => {
    return records.filter(r => {
      const [rAno, rMes] = r.data.split('-').map(Number);
      return rAno === ano && rMes === mes;
    });
  };

  const getMonthConfig = (ano: number, mes: number): MonthConfig | null => {
    const key = `${ano}-${String(mes).padStart(2, '0')}`;
    return monthConfigs[key] || null;
  };

  const hasMonthConfig = (ano: number, mes: number): boolean => {
    const key = `${ano}-${String(mes).padStart(2, '0')}`;
    return !!monthConfigs[key];
  };

  const saveMonthConfig = (config: MonthConfig) => {
    const configWithCalculations = {
      ...config,
      metaDiaria: calcularMetaDiaria(config.metaMensal, config.diasPlanejados),
      custoFixoDiario: 0,
    };

    const key = `${config.ano}-${String(config.mes).padStart(2, '0')}`;
    const updatedConfigs = { ...monthConfigs, [key]: configWithCalculations };

    setMonthConfigs(updatedConfigs);
    setCurrentMonthConfig(configWithCalculations);
    storage.saveMonthConfig(configWithCalculations);
  };

  const resetAllData = () => {
    storage.clearAllData();
    setUser(null);
    setRecords([]);
    setMonthConfigs({});
    setCurrentMonthConfig(null);
  };

  // Plataformas
  const getPlataformasAtivas = (): AppPlataforma[] => {
    if (!user?.plataformas) return [];
    return user.plataformas.filter(p => p.ativo);
  };

  const addPlataforma = (nome: string, icone: string, cor: string) => {
    if (!user) return;
    const nova: AppPlataforma = {
      id: gerarId(),
      nome,
      cor,
      icone,
      ativo: true,
    };
    const updatedUser = { ...user, plataformas: [...(user.plataformas || []), nova] };
    saveUser(updatedUser);
  };

  const updatePlataforma = (plataforma: AppPlataforma) => {
    if (!user) return;
    const updatedPlataformas = (user.plataformas || []).map(p =>
      p.id === plataforma.id ? plataforma : p
    );
    const updatedUser = { ...user, plataformas: updatedPlataformas };
    saveUser(updatedUser);
  };

  const togglePlataforma = (id: string) => {
    if (!user) return;
    const updatedPlataformas = (user.plataformas || []).map(p =>
      p.id === id ? { ...p, ativo: !p.ativo } : p
    );
    const updatedUser = { ...user, plataformas: updatedPlataformas };
    saveUser(updatedUser);
  };

  const value: AppContextType = {
    user,
    setUser,
    saveUser,
    records,
    addRecord,
    updateRecord,
    deleteRecord,
    getRecordByDate,
    getRecordsByMonth,
    monthConfig: currentMonthConfig,
    getMonthConfig,
    setMonthConfig: setCurrentMonthConfig,
    saveMonthConfig,
    hasMonthConfig,
    currentView,
    setCurrentView,
    selectedDate,
    setSelectedDate,
    isLoading,
    resetAllData,
    getPlataformasAtivas,
    addPlataforma,
    updatePlataforma,
    togglePlataforma,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}


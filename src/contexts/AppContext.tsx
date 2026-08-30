import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { UserProfile, DailyRecord, MonthConfig, ViewType, AppPlataforma } from '@/types';
import * as storage from '@/lib/storage';
import { calcularMetaDiaria, calcularCustoFixoDiario, getDiasUteis, gerarId } from '@/lib/calculations';
import { sincronizarLembretesDiarios, registrarListenerNotificacao, HORARIO_PADRAO } from '@/lib/notifications';

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
  saveMonthConfig: (config: MonthConfig) => MonthConfig;
  hasMonthConfig: (ano: number, mes: number) => boolean;
  ensureMonthConfig: (ano: number, mes: number) => MonthConfig;
  
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

  // Lembrete diário
  reminderEnabled: boolean;
  setReminderEnabled: (enabled: boolean) => void;
  reminderTime: string;
  setReminderTime: (time: string) => void;

  // Plataformas
  addPlataforma: (nome: string, icone: string, cor: string) => void;
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
  const [reminderEnabled, setReminderEnabledState] = useState(false);
  const [reminderTime, setReminderTimeState] = useState(HORARIO_PADRAO);

  const buscarRegistro = (lista: DailyRecord[], data: string) => lista.find(r => r.data === data);

  useEffect(() => {
    const loadData = () => {
      const savedUser = storage.getUser();
      const savedRecords = storage.getRecords();
      const savedMonthConfigs = storage.getAllMonthConfigs();
      const savedReminderEnabled = storage.getReminderEnabled();
      const savedReminderTime = storage.getReminderTime();

      if (savedUser) setUser(savedUser);
      if (savedRecords) setRecords(savedRecords);
      if (savedMonthConfigs) setMonthConfigs(savedMonthConfigs);
      setReminderEnabledState(savedReminderEnabled);
      setReminderTimeState(savedReminderTime);

      const now = new Date();
      const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      if (savedMonthConfigs && savedMonthConfigs[currentKey]) {
        setCurrentMonthConfig(savedMonthConfigs[currentKey]);
      }

      setIsLoading(false);
      sincronizarLembretesDiarios(savedReminderEnabled, savedReminderTime, (data) => buscarRegistro(savedRecords, data));
    };

    loadData();

    registrarListenerNotificacao((data) => {
      setSelectedDate(new Date(`${data}T12:00:00`));
      setCurrentView('register');
    });
  }, []);

  const setReminderEnabled = (enabled: boolean) => {
    storage.setReminderEnabled(enabled);
    setReminderEnabledState(enabled);
    sincronizarLembretesDiarios(enabled, reminderTime, (data) => buscarRegistro(storage.getRecords(), data));
  };

  const setReminderTime = (time: string) => {
    storage.setReminderTime(time);
    setReminderTimeState(time);
    sincronizarLembretesDiarios(reminderEnabled, time, (data) => buscarRegistro(storage.getRecords(), data));
  };

  const saveUser = (newUser: UserProfile) => {
    setUser(newUser);
    storage.saveUser(newUser);
  };

  const addRecord = (record: DailyRecord) => {
    storage.saveRecord(record);
    const updated = storage.getRecords();
    setRecords(updated);
    sincronizarLembretesDiarios(reminderEnabled, reminderTime, (data) => buscarRegistro(updated, data));
  };

  const updateRecord = (record: DailyRecord) => {
    storage.saveRecord(record);
    const updated = storage.getRecords();
    setRecords(updated);
    sincronizarLembretesDiarios(reminderEnabled, reminderTime, (data) => buscarRegistro(updated, data));
  };

  const deleteRecord = (id: string) => {
    storage.deleteRecord(id);
    const updated = storage.getRecords();
    setRecords(updated);
    sincronizarLembretesDiarios(reminderEnabled, reminderTime, (data) => buscarRegistro(updated, data));
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

  const saveMonthConfig = (config: MonthConfig): MonthConfig => {
    const configWithCalculations = {
      ...config,
      metaDiaria: calcularMetaDiaria(config.metaMensal, config.diasPlanejados),
      custoFixoDiario: calcularCustoFixoDiario(
        user?.totalCustosFixos ?? 0,
        config.diasPlanejados
      ),
    };

    const key = `${config.ano}-${String(config.mes).padStart(2, '0')}`;
    const updatedConfigs = { ...monthConfigs, [key]: configWithCalculations };

    setMonthConfigs(updatedConfigs);
    setCurrentMonthConfig(configWithCalculations);
    storage.saveMonthConfig(configWithCalculations);
    return configWithCalculations;
  };

  // Cria (e persiste) uma configuração padrão pro mês na primeira vez que ele
  // é visitado, usando a meta padrão do usuário e domingos como folga - assim
  // o usuário não precisa configurar manualmente todo mês antes de usar o app.
  const ensureMonthConfig = (ano: number, mes: number): MonthConfig => {
    const existente = getMonthConfig(ano, mes);
    if (existente) return existente;

    const diasNoMes = new Date(ano, mes, 0).getDate();
    const domingos: string[] = [];
    for (let dia = 1; dia <= diasNoMes; dia++) {
      if (new Date(ano, mes - 1, dia).getDay() === 0) {
        domingos.push(`${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`);
      }
    }

    return saveMonthConfig({
      ano,
      mes,
      diasPlanejados: getDiasUteis(ano, mes),
      diasFolga: domingos,
      metaMensal: user?.metaMensalPadrao || 11000,
      metaDiaria: 0,
      custoFixoDiario: 0,
    });
  };

  // Plataformas
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

  const togglePlataforma = (id: string) => {
    if (!user) return;
    const updatedPlataformas = (user.plataformas || []).map(p =>
      p.id === id ? { ...p, ativo: !p.ativo } : p
    );
    const updatedUser = { ...user, plataformas: updatedPlataformas };
    saveUser(updatedUser);
  };

  const resetAllData = () => {
    storage.clearAllData();
    setUser(null);
    setRecords([]);
    setMonthConfigs({});
    setCurrentMonthConfig(null);
    setReminderEnabledState(false);
    sincronizarLembretesDiarios(false, reminderTime, () => undefined);
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
    ensureMonthConfig,
    currentView,
    setCurrentView,
    selectedDate,
    setSelectedDate,
    isLoading,
    resetAllData,
    reminderEnabled,
    setReminderEnabled,
    reminderTime,
    setReminderTime,
    addPlataforma,
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

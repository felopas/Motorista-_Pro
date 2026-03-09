// Tipos principais do App Motorista Pro

export interface UserProfile {
  nome: string;
  carro: string;
  mediaGasolina: number; // km por litro
  custosFixos: FixedCost[];
  totalCustosFixos: number;
}

export interface FixedCost {
  id: string;
  descricao: string;
  valorMensal: number;
  categoria: 'seguro' | 'ipva' | 'financiamento' | 'manutencao' | 'outro';
  ativo: boolean;
}

export interface DailyRecord {
  id: string;
  data: string; // ISO date string YYYY-MM-DD
  faturamentoBruto: number;
  kmRodado: number;
  horasTrabalhadas: number;
  numCorridas: number;
  custoCombustivel: number;
  custoAlimentacao: number;
  custoOutros: number;
  custoTotal: number;
  lucroLiquido: number;
  ehFolga: boolean;
  observacoes?: string;
  metaDiaDinamica?: number; // Meta dinâmica do dia no momento do registro
}

export interface MonthConfig {
  ano: number;
  mes: number; // 1-12
  diasPlanejados: number;
  diasFolga: string[]; // Array de datas ISO YYYY-MM-DD
  metaMensal: number;
  metaDiaria: number;
  custoFixoDiario: number;
}

export type DayStatus = 'bom' | 'regular' | 'ruim' | 'folga' | 'vazio';

export interface CalendarDay {
  date: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isHoliday: boolean;
  record?: DailyRecord;
  status: DayStatus;
  lucro?: number;
}

export type ViewType = 'dashboard' | 'calendar' | 'register' | 'history' | 'settings' | 'monthConfig';

export interface AppState {
  user: UserProfile | null;
  currentMonthConfig: MonthConfig | null;
  records: DailyRecord[];
  currentView: ViewType;
}

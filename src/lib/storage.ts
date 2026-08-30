import type { UserProfile, DailyRecord, MonthConfig } from '@/types';

const STORAGE_KEYS = {
  USER: 'motorista_pro_user',
  RECORDS: 'motorista_pro_records',
  MONTH_CONFIGS: 'motorista_pro_month_configs', // Agora armazena múltiplos meses
  REMINDER_ENABLED: 'motorista_pro_reminder_enabled',
  REMINDER_TIME: 'motorista_pro_reminder_time',
};

// Lembrete diário (notificação local)
export function getReminderEnabled(): boolean {
  return localStorage.getItem(STORAGE_KEYS.REMINDER_ENABLED) === 'true';
}

export function setReminderEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEYS.REMINDER_ENABLED, String(enabled));
}

export function getReminderTime(): string {
  return localStorage.getItem(STORAGE_KEYS.REMINDER_TIME) || '20:00';
}

export function setReminderTime(time: string): void {
  localStorage.setItem(STORAGE_KEYS.REMINDER_TIME, time);
}

// User Profile
export function saveUser(user: UserProfile): void {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export function getUser(): UserProfile | null {
  const data = localStorage.getItem(STORAGE_KEYS.USER);
  return data ? JSON.parse(data) : null;
}

export function clearUser(): void {
  localStorage.removeItem(STORAGE_KEYS.USER);
}

// Daily Records
export function saveRecord(record: DailyRecord): void {
  const records = getRecords();
  const existingIndex = records.findIndex(r => r.data === record.data);
  
  if (existingIndex >= 0) {
    records[existingIndex] = record;
  } else {
    records.push(record);
  }
  
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
}

export function getRecords(): DailyRecord[] {
  const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
  return data ? JSON.parse(data) : [];
}

export function getRecordsByMonth(ano: number, mes: number): DailyRecord[] {
  const records = getRecords();
  return records.filter(r => {
    const [rAno, rMes] = r.data.split('-').map(Number);
    return rAno === ano && rMes === mes;
  });
}

export function getRecordByDate(data: string): DailyRecord | undefined {
  const records = getRecords();
  return records.find(r => r.data === data);
}

export function deleteRecord(id: string): void {
  const records = getRecords();
  const filtered = records.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(filtered));
}

export function clearAllRecords(): void {
  localStorage.removeItem(STORAGE_KEYS.RECORDS);
}

// Month Configs - Agora suporta múltiplos meses
export function saveMonthConfig(config: MonthConfig): void {
  const configs = getAllMonthConfigs();
  const key = `${config.ano}-${String(config.mes).padStart(2, '0')}`;
  configs[key] = config;
  localStorage.setItem(STORAGE_KEYS.MONTH_CONFIGS, JSON.stringify(configs));
}

export function getAllMonthConfigs(): Record<string, MonthConfig> {
  const data = localStorage.getItem(STORAGE_KEYS.MONTH_CONFIGS);
  return data ? JSON.parse(data) : {};
}

export function getMonthConfig(): MonthConfig | null {
  // Para compatibilidade, retorna o mês atual ou o mais recente
  const configs = getAllMonthConfigs();
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  if (configs[currentKey]) {
    return configs[currentKey];
  }
  
  // Retorna o mais recente
  const keys = Object.keys(configs).sort();
  return keys.length > 0 ? configs[keys[keys.length - 1]] : null;
}

export function getMonthConfigByDate(ano: number, mes: number): MonthConfig | null {
  const configs = getAllMonthConfigs();
  const key = `${ano}-${String(mes).padStart(2, '0')}`;
  return configs[key] || null;
}

export function clearMonthConfigs(): void {
  localStorage.removeItem(STORAGE_KEYS.MONTH_CONFIGS);
}

// Clear all data
export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}

// Check if first time user
export function isFirstTimeUser(): boolean {
  return !getUser();
}

// Export data as JSON
export function exportData(): string {
  const data = {
    user: getUser(),
    records: getRecords(),
    monthConfigs: getAllMonthConfigs(),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

// Valida o formato mínimo esperado de um backup antes de aceitar - um JSON
// malformado ou de outra origem não deve conseguir corromper o estado salvo.
function ehBackupValido(data: unknown): data is {
  user?: UserProfile;
  records?: DailyRecord[];
  monthConfigs?: Record<string, MonthConfig>;
} {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;

  if (d.user !== undefined) {
    if (typeof d.user !== 'object' || d.user === null) return false;
    const u = d.user as Record<string, unknown>;
    if (typeof u.nome !== 'string' || typeof u.carro !== 'string') return false;
  }

  if (d.records !== undefined) {
    if (!Array.isArray(d.records)) return false;
    if (!d.records.every((r) => typeof r === 'object' && r !== null && typeof (r as Record<string, unknown>).data === 'string')) {
      return false;
    }
  }

  if (d.monthConfigs !== undefined) {
    if (typeof d.monthConfigs !== 'object' || d.monthConfigs === null || Array.isArray(d.monthConfigs)) return false;
  }

  return true;
}

// Import data from JSON
export function importData(jsonString: string): boolean {
  try {
    const data: unknown = JSON.parse(jsonString);
    if (!ehBackupValido(data)) return false;
    if (data.user) saveUser(data.user);
    if (data.records) localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(data.records));
    if (data.monthConfigs) localStorage.setItem(STORAGE_KEYS.MONTH_CONFIGS, JSON.stringify(data.monthConfigs));
    return true;
  } catch {
    return false;
  }
}

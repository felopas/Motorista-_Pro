import { describe, it, expect, beforeEach } from 'vitest';
import type { UserProfile, DailyRecord, MonthConfig } from '@/types';
import {
  saveUser,
  getUser,
  clearUser,
  saveRecord,
  getRecords,
  getRecordsByMonth,
  getRecordByDate,
  deleteRecord,
  clearAllRecords,
  saveMonthConfig,
  getAllMonthConfigs,
  getMonthConfig,
  getMonthConfigByDate,
  clearMonthConfigs,
  clearAllData,
  isFirstTimeUser,
  exportData,
  importData,
} from './storage';

function makeUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    nome: 'João',
    carro: 'Onix',
    mediaGasolina: 12,
    precoCombustivel: 5.5,
    custosFixos: [],
    totalCustosFixos: 0,
    ...overrides,
  };
}

function makeRecord(overrides: Partial<DailyRecord> = {}): DailyRecord {
  return {
    id: 'r1',
    data: '2024-01-02',
    faturamentoBruto: 200,
    kmRodado: 100,
    horasTrabalhadas: 8,
    numCorridas: 10,
    custoCombustivel: 40,
    custoAlimentacao: 20,
    custoOutros: 0,
    custoTotal: 60,
    lucroLiquido: 140,
    ehFolga: false,
    ...overrides,
  };
}

function makeMonthConfig(overrides: Partial<MonthConfig> = {}): MonthConfig {
  return {
    ano: 2024,
    mes: 1,
    diasPlanejados: 26,
    diasFolga: [],
    metaMensal: 5000,
    metaDiaria: 200,
    custoFixoDiario: 20,
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe('storage: user profile', () => {
  it('saveUser/getUser round-trips the profile', () => {
    const user = makeUser();
    saveUser(user);
    expect(getUser()).toEqual(user);
  });

  it('getUser returns null when nothing saved', () => {
    expect(getUser()).toBeNull();
  });

  it('clearUser removes the stored profile', () => {
    saveUser(makeUser());
    clearUser();
    expect(getUser()).toBeNull();
  });
});

describe('storage: records', () => {
  it('saveRecord creates a new entry', () => {
    saveRecord(makeRecord({ id: 'r1', data: '2024-01-02' }));
    expect(getRecords()).toHaveLength(1);
  });

  it('saveRecord with same data (date) upserts instead of duplicating', () => {
    saveRecord(makeRecord({ id: 'r1', data: '2024-01-02', faturamentoBruto: 200 }));
    saveRecord(makeRecord({ id: 'r2', data: '2024-01-02', faturamentoBruto: 999 }));

    const records = getRecords();
    expect(records).toHaveLength(1);
    expect(records[0].faturamentoBruto).toBe(999);
  });

  it('getRecordsByMonth filters by year and month', () => {
    saveRecord(makeRecord({ id: 'r1', data: '2024-01-02' }));
    saveRecord(makeRecord({ id: 'r2', data: '2024-01-15' }));
    saveRecord(makeRecord({ id: 'r3', data: '2024-02-01' }));

    const jan = getRecordsByMonth(2024, 1);
    expect(jan).toHaveLength(2);
    expect(jan.map(r => r.id).sort()).toEqual(['r1', 'r2']);
  });

  it('getRecordByDate finds the matching record', () => {
    saveRecord(makeRecord({ id: 'r1', data: '2024-01-02' }));
    expect(getRecordByDate('2024-01-02')?.id).toBe('r1');
    expect(getRecordByDate('2024-05-05')).toBeUndefined();
  });

  it('deleteRecord removes only the targeted id', () => {
    saveRecord(makeRecord({ id: 'r1', data: '2024-01-02' }));
    saveRecord(makeRecord({ id: 'r2', data: '2024-01-03' }));

    deleteRecord('r1');

    const records = getRecords();
    expect(records).toHaveLength(1);
    expect(records[0].id).toBe('r2');
  });

  it('clearAllRecords empties the record list', () => {
    saveRecord(makeRecord({ id: 'r1', data: '2024-01-02' }));
    clearAllRecords();
    expect(getRecords()).toEqual([]);
  });
});

describe('storage: month configs', () => {
  it('saveMonthConfig/getMonthConfigByDate round-trips a config', () => {
    const config = makeMonthConfig({ ano: 2024, mes: 3 });
    saveMonthConfig(config);
    expect(getMonthConfigByDate(2024, 3)).toEqual(config);
  });

  it('getAllMonthConfigs returns all saved configs keyed by year-month', () => {
    saveMonthConfig(makeMonthConfig({ ano: 2024, mes: 1 }));
    saveMonthConfig(makeMonthConfig({ ano: 2024, mes: 2 }));

    const all = getAllMonthConfigs();
    expect(Object.keys(all).sort()).toEqual(['2024-01', '2024-02']);
  });

  it('getMonthConfig returns the most recent config when current month is absent', () => {
    saveMonthConfig(makeMonthConfig({ ano: 2020, mes: 1 }));
    saveMonthConfig(makeMonthConfig({ ano: 2021, mes: 6 }));

    const result = getMonthConfig();
    expect(result?.ano).toBe(2021);
    expect(result?.mes).toBe(6);
  });

  it('getMonthConfigByDate returns null when missing', () => {
    expect(getMonthConfigByDate(1999, 1)).toBeNull();
  });

  it('clearMonthConfigs empties all configs', () => {
    saveMonthConfig(makeMonthConfig());
    clearMonthConfigs();
    expect(getAllMonthConfigs()).toEqual({});
  });
});

describe('storage: isFirstTimeUser', () => {
  it('is true when there is no saved user', () => {
    expect(isFirstTimeUser()).toBe(true);
  });

  it('is false once a user is saved', () => {
    saveUser(makeUser());
    expect(isFirstTimeUser()).toBe(false);
  });
});

describe('storage: clearAllData', () => {
  it('removes user, records and month configs', () => {
    saveUser(makeUser());
    saveRecord(makeRecord());
    saveMonthConfig(makeMonthConfig());

    clearAllData();

    expect(getUser()).toBeNull();
    expect(getRecords()).toEqual([]);
    expect(getAllMonthConfigs()).toEqual({});
  });
});

describe('storage: export/import', () => {
  it('exportData produces valid JSON containing user/records/monthConfigs', () => {
    const user = makeUser();
    const record = makeRecord();
    const config = makeMonthConfig();

    saveUser(user);
    saveRecord(record);
    saveMonthConfig(config);

    const json = exportData();
    const parsed = JSON.parse(json);

    expect(parsed.user).toEqual(user);
    expect(parsed.records).toEqual([record]);
    expect(parsed.monthConfigs).toEqual({ '2024-01': config });
    expect(typeof parsed.exportedAt).toBe('string');
  });

  it('importData restores everything into fresh storage', () => {
    const user = makeUser();
    const record = makeRecord();
    const config = makeMonthConfig();

    saveUser(user);
    saveRecord(record);
    saveMonthConfig(config);
    const json = exportData();

    // Simulate a fresh storage
    localStorage.clear();
    expect(getUser()).toBeNull();

    const result = importData(json);

    expect(result).toBe(true);
    expect(getUser()).toEqual(user);
    expect(getRecords()).toEqual([record]);
    expect(getAllMonthConfigs()).toEqual({ '2024-01': config });
  });

  it('importData returns false on malformed JSON input without throwing', () => {
    expect(() => importData('{not valid json')).not.toThrow();
    expect(importData('{not valid json')).toBe(false);
  });
});

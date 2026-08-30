import { describe, it, expect } from 'vitest';
import type { DailyRecord, MonthConfig } from '@/types';
import {
  getDiasUteis,
  calcularMetaDiaria,
  calcularMetaDiariaAtualizada,
  calcularLucroLiquido,
  calcularLiquidoPorHora,
  calcularLiquidoPorKm,
  calcularPercentualMeta,
  getDayStatus,
  getStatusColor,
  calcularResumoMensal,
  formatarMoeda,
  formatarNumero,
  getNomeMes,
  getDiaSemanaAbrev,
  isDomingo,
  gerarId,
} from './calculations';

function makeRecord(overrides: Partial<DailyRecord> = {}): DailyRecord {
  return {
    id: 'r1',
    data: '2024-01-02',
    faturamentoBruto: 0,
    kmRodado: 0,
    horasTrabalhadas: 0,
    numCorridas: 0,
    custoCombustivel: 0,
    custoAlimentacao: 0,
    custoOutros: 0,
    custoTotal: 0,
    lucroLiquido: 0,
    ehFolga: false,
    ...overrides,
  };
}

function makeConfig(overrides: Partial<MonthConfig> = {}): MonthConfig {
  return {
    ano: 2024,
    mes: 1,
    diasPlanejados: 30,
    diasFolga: [],
    metaMensal: 3000,
    metaDiaria: 100,
    custoFixoDiario: 20,
    ...overrides,
  };
}

describe('getDiasUteis', () => {
  it('conta dias úteis excluindo domingos - janeiro/2024 (31 dias, 4 domingos)', () => {
    expect(getDiasUteis(2024, 1)).toBe(27);
  });

  it('conta dias úteis excluindo domingos - fevereiro/2024 (29 dias, bissexto, 4 domingos)', () => {
    expect(getDiasUteis(2024, 2)).toBe(25);
  });
});

describe('calcularMetaDiaria', () => {
  it('divide a meta mensal pelos dias planejados', () => {
    expect(calcularMetaDiaria(3000, 30)).toBe(100);
  });

  it('retorna 0 quando diasPlanejados é 0 (guarda de divisão por zero)', () => {
    expect(calcularMetaDiaria(1000, 0)).toBe(0);
  });
});

describe('calcularMetaDiariaAtualizada', () => {
  it('urgência normal quando o ritmo está dentro do esperado', () => {
    const resultado = calcularMetaDiariaAtualizada(3000, 500, 30, 5);
    expect(resultado.meta).toBeCloseTo(100, 5);
    expect(resultado.urgencia).toBe('normal');
  });

  it('urgência alta quando a meta diária sobe acima de 1.1x o original', () => {
    const resultado = calcularMetaDiariaAtualizada(3000, 600, 30, 10);
    expect(resultado.meta).toBeCloseTo(120, 5);
    expect(resultado.urgencia).toBe('alta');
  });

  it('urgência crítica quando a meta diária sobe acima de 1.3x o original', () => {
    const resultado = calcularMetaDiariaAtualizada(3000, 1600, 30, 20);
    expect(resultado.meta).toBeCloseTo(140, 5);
    expect(resultado.urgencia).toBe('critica');
  });

  it('sem dias restantes e meta ainda não batida: retorna o que falta com urgência crítica', () => {
    const resultado = calcularMetaDiariaAtualizada(3000, 2000, 30, 30);
    expect(resultado.meta).toBe(1000);
    expect(resultado.urgencia).toBe('critica');
  });

  it('sem dias restantes e meta já superada: meta zerada, urgência crítica', () => {
    const resultado = calcularMetaDiariaAtualizada(3000, 3500, 30, 30);
    expect(resultado.meta).toBe(0);
    expect(resultado.urgencia).toBe('critica');
  });
});

describe('calcularLucroLiquido', () => {
  it('subtrai os custos variáveis do bruto', () => {
    expect(calcularLucroLiquido(300, 80)).toBe(220);
  });

  it('permite lucro negativo quando custos superam o bruto', () => {
    expect(calcularLucroLiquido(100, 150)).toBe(-50);
  });
});

describe('calcularLiquidoPorHora', () => {
  it('divide o líquido pelas horas trabalhadas', () => {
    expect(calcularLiquidoPorHora(200, 8)).toBe(25);
  });

  it('retorna 0 quando horas é 0 (guarda de divisão por zero)', () => {
    expect(calcularLiquidoPorHora(200, 0)).toBe(0);
  });
});

describe('calcularLiquidoPorKm', () => {
  it('divide o líquido pelo km rodado', () => {
    expect(calcularLiquidoPorKm(200, 100)).toBe(2);
  });

  it('retorna 0 quando km é 0 (guarda de divisão por zero)', () => {
    expect(calcularLiquidoPorKm(200, 0)).toBe(0);
  });
});

describe('calcularPercentualMeta', () => {
  it('calcula o percentual do realizado sobre a meta', () => {
    expect(calcularPercentualMeta(500, 3000)).toBeCloseTo(16.6667, 3);
  });

  it('retorna 0 quando a meta é 0 (guarda de divisão por zero)', () => {
    expect(calcularPercentualMeta(500, 0)).toBe(0);
  });
});

describe('getDayStatus', () => {
  const config = makeConfig({ metaDiaria: 100 });

  it('retorna "vazio" quando não há registro', () => {
    expect(getDayStatus(undefined, config)).toBe('vazio');
  });

  it('retorna "folga" quando o registro é marcado como folga', () => {
    const registro = makeRecord({ ehFolga: true, faturamentoBruto: 0 });
    expect(getDayStatus(registro, config)).toBe('folga');
  });

  it('retorna "bom" quando o bruto atinge a meta diária', () => {
    const registro = makeRecord({ faturamentoBruto: 100 });
    expect(getDayStatus(registro, config)).toBe('bom');
  });

  it('retorna "bom" quando o bruto supera a meta diária', () => {
    const registro = makeRecord({ faturamentoBruto: 150 });
    expect(getDayStatus(registro, config)).toBe('bom');
  });

  it('retorna "regular" quando o bruto está entre 80% e a meta diária', () => {
    const registro = makeRecord({ faturamentoBruto: 80 });
    expect(getDayStatus(registro, config)).toBe('regular');
  });

  it('retorna "ruim" quando o bruto fica abaixo de 80% da meta diária', () => {
    const registro = makeRecord({ faturamentoBruto: 79 });
    expect(getDayStatus(registro, config)).toBe('ruim');
  });
});

describe('getStatusColor', () => {
  it('mapeia cada status para sua cor esperada', () => {
    expect(getStatusColor('bom')).toBe('#22c55e');
    expect(getStatusColor('regular')).toBe('#eab308');
    expect(getStatusColor('ruim')).toBe('#ef4444');
    expect(getStatusColor('folga')).toBe('#64748b');
    expect(getStatusColor('vazio')).toBe('#1e293b');
  });
});

describe('calcularResumoMensal', () => {
  it('agrega registros do mês corretamente', () => {
    const records: DailyRecord[] = [
      makeRecord({
        id: 'r1',
        data: '2024-01-02',
        faturamentoBruto: 200,
        custoTotal: 50,
        lucroLiquido: 150,
        kmRodado: 100,
        horasTrabalhadas: 8,
        numCorridas: 10,
        ehFolga: false,
      }),
      makeRecord({
        id: 'r2',
        data: '2024-01-03',
        faturamentoBruto: 300,
        custoTotal: 80,
        lucroLiquido: 220,
        kmRodado: 150,
        horasTrabalhadas: 10,
        numCorridas: 15,
        ehFolga: false,
      }),
      makeRecord({
        id: 'r3',
        data: '2024-01-04',
        faturamentoBruto: 0,
        custoTotal: 0,
        lucroLiquido: 0,
        kmRodado: 0,
        horasTrabalhadas: 0,
        numCorridas: 0,
        ehFolga: true,
      }),
    ];
    const config = makeConfig({ metaMensal: 3000, diasPlanejados: 30, custoFixoDiario: 20 });

    const resumo = calcularResumoMensal(records, config);

    expect(resumo.diasTrabalhados).toBe(2);
    expect(resumo.diasFolga).toBe(1);
    expect(resumo.totalBruto).toBe(500);
    expect(resumo.totalCustosVariaveis).toBe(130);
    expect(resumo.totalLucro).toBe(370);
    expect(resumo.totalKm).toBe(250);
    expect(resumo.totalHoras).toBe(18);
    expect(resumo.totalCorridas).toBe(25);
    expect(resumo.mediaLucroPorHora).toBeCloseTo(370 / 18, 5);
    expect(resumo.mediaLucroPorKm).toBeCloseTo(370 / 250, 5);
    expect(resumo.percentualMeta).toBeCloseTo((500 / 3000) * 100, 5);
    expect(resumo.custoFixoRateio).toBe(40); // 20 * 2 dias trabalhados
    expect(resumo.totalLucroComFixos).toBe(330); // 370 - 40
  });

  it('lida com lista vazia sem dividir por zero', () => {
    const config = makeConfig();
    const resumo = calcularResumoMensal([], config);

    expect(resumo.diasTrabalhados).toBe(0);
    expect(resumo.diasFolga).toBe(0);
    expect(resumo.totalBruto).toBe(0);
    expect(resumo.mediaLucroPorHora).toBe(0);
    expect(resumo.mediaLucroPorKm).toBe(0);
    expect(resumo.custoFixoRateio).toBe(0);
  });
});

describe('formatarMoeda', () => {
  it('formata valores como moeda brasileira (BRL)', () => {
    const resultado = formatarMoeda(1234.56);
    expect(resultado).toContain('1.234,56');
    expect(resultado).toContain('R$');
  });

  it('formata zero corretamente', () => {
    const resultado = formatarMoeda(0);
    expect(resultado).toContain('0,00');
  });
});

describe('formatarNumero', () => {
  it('formata com 2 casas decimais por padrão', () => {
    expect(formatarNumero(3.14159)).toBe('3.14');
  });

  it('respeita o número de casas informado', () => {
    expect(formatarNumero(3, 0)).toBe('3');
    expect(formatarNumero(2.5, 1)).toBe('2.5');
  });
});

describe('getNomeMes', () => {
  it('retorna o nome do mês em português para janeiro e dezembro', () => {
    expect(getNomeMes(1)).toBe('Janeiro');
    expect(getNomeMes(12)).toBe('Dezembro');
  });
});

describe('getDiaSemanaAbrev', () => {
  it('retorna a abreviação correta do dia da semana', () => {
    expect(getDiaSemanaAbrev('2024-01-01')).toBe('Seg'); // segunda-feira
    expect(getDiaSemanaAbrev('2024-01-07')).toBe('Dom'); // domingo
  });
});

describe('isDomingo', () => {
  it('identifica corretamente domingos', () => {
    expect(isDomingo('2024-01-07')).toBe(true);
  });

  it('identifica corretamente dias que não são domingo', () => {
    expect(isDomingo('2024-01-01')).toBe(false);
  });
});

describe('gerarId', () => {
  it('gera strings não vazias', () => {
    const id = gerarId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('gera ids únicos em chamadas sucessivas', () => {
    const ids = new Set(Array.from({ length: 200 }, () => gerarId()));
    expect(ids.size).toBe(200);
  });
});

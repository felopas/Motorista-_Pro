import type { DailyRecord, MonthConfig, DayStatus, AppPlataforma } from '@/types';

// Obter dias úteis do mês (excluindo domingos)
export function getDiasUteis(ano: number, mes: number): number {
  const totalDias = new Date(ano, mes, 0).getDate();
  let uteis = 0;
  for (let dia = 1; dia <= totalDias; dia++) {
    const data = new Date(ano, mes - 1, dia);
    if (data.getDay() !== 0) uteis++; // 0 = Domingo
  }
  return uteis;
}

// Calcular meta diária base
export function calcularMetaDiaria(
  metaMensal: number,
  diasPlanejados: number
): number {
  if (diasPlanejados === 0) return 0;
  return metaMensal / diasPlanejados;
}

// Calcular meta diária dinâmica (recálculo baseado no progresso)
export function calcularMetaDiariaAtualizada(
  metaMensal: number,
  realizado: number,
  diasPlanejados: number,
  diasTrabalhados: number
): { meta: number; urgencia: 'normal' | 'alta' | 'critica' } {
  const falta = metaMensal - realizado;
  const diasRestantes = diasPlanejados - diasTrabalhados;

  if (diasRestantes <= 0) return { meta: falta > 0 ? falta : 0, urgencia: 'critica' };

  const metaDiaria = falta / diasRestantes;
  const metaOriginal = metaMensal / diasPlanejados;

  let urgencia: 'normal' | 'alta' | 'critica' = 'normal';
  if (metaDiaria > metaOriginal * 1.3) urgencia = 'critica';
  else if (metaDiaria > metaOriginal * 1.1) urgencia = 'alta';

  return { meta: metaDiaria, urgencia };
}

// Calcular lucro líquido (sem custo fixo)
export function calcularLucroLiquido(
  bruto: number,
  custosVariaveis: number
): number {
  return bruto - custosVariaveis;
}

// Calcular líquido por hora
export function calcularLiquidoPorHora(
  liquido: number,
  horas: number

): number {
  if (horas === 0) return 0;
  return liquido / horas;
}

// Calcular líquido por KM
export function calcularLiquidoPorKm(
  liquido: number,
  km: number
): number {
  if (km === 0) return 0;
  return liquido / km;
}

// Calcular percentual da meta
export function calcularPercentualMeta(
  realizado: number,
  meta: number
): number {
  if (meta === 0) return 0;
  return (realizado / meta) * 100;
}

// Determinar status do dia baseado no faturamento bruto vs meta diária
export function getDayStatus(
  registro: DailyRecord | undefined,
  config: MonthConfig
): DayStatus {
  if (!registro) return 'vazio';
  if (registro.ehFolga) return 'folga';

  const bruto = registro.faturamentoBruto;
  const metaDiaria = config.metaDiaria;

  if (bruto >= metaDiaria) return 'bom';
  if (bruto >= metaDiaria * 0.8) return 'regular';
  return 'ruim';
}

// Calcular cor do status
export function getStatusColor(status: DayStatus): string {
  switch (status) {
    case 'bom': return '#22c55e'; // Verde
    case 'regular': return '#eab308'; // Amarelo
    case 'ruim': return '#ef4444'; // Vermelho
    case 'folga': return '#64748b'; // Cinza
    case 'vazio': return '#1e293b'; // Cinza escuro
    default: return '#1e293b';
  }
}

// Calcular resumo do mês
export function calcularResumoMensal(
  records: DailyRecord[],
  config: MonthConfig
) {
  const diasTrabalhados = records.filter(r => !r.ehFolga).length;
  const diasFolga = records.filter(r => r.ehFolga).length;

  const totalBruto = records.reduce((sum, r) => sum + r.faturamentoBruto, 0);
  const totalCustosVariaveis = records.reduce((sum, r) => sum + r.custoTotal, 0);
  const totalLucro = records.reduce((sum, r) => sum + r.lucroLiquido, 0);

  const totalKm = records.reduce((sum, r) => sum + r.kmRodado, 0);
  const totalHoras = records.reduce((sum, r) => sum + r.horasTrabalhadas, 0);
  const totalCorridas = records.reduce((sum, r) => sum + r.numCorridas, 0);

  const mediaLucroPorHora = totalHoras > 0 ? totalLucro / totalHoras : 0;
  const mediaLucroPorKm = totalKm > 0 ? totalLucro / totalKm : 0;
  const percentualMeta = calcularPercentualMeta(totalBruto, config.metaMensal);

  const { meta: metaDiariaAtual, urgencia } = calcularMetaDiariaAtualizada(
    config.metaMensal,
    totalBruto,
    config.diasPlanejados,
    diasTrabalhados
  );

  return {
    totalBruto,
    totalCustosVariaveis,
    totalLucro,
    totalKm,
    totalHoras,
    totalCorridas,
    mediaLucroPorHora,
    mediaLucroPorKm,
    percentualMeta,
    diasTrabalhados,
    diasFolga,
    metaDiariaAtual,
    urgencia,
  };
}

// Formatar valor monetário
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

// Formatar número com 2 casas decimais
export function formatarNumero(valor: number, casas = 2): string {
  return valor.toFixed(casas);
}

// Obter nome do mês
export function getNomeMes(mes: number): string {
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return meses[mes - 1];
}

// Obter dia da semana abreviado
export function getDiaSemanaAbrev(data: string): string {
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const d = new Date(data + 'T12:00:00');
  return dias[d.getDay()];
}

// Verificar se é domingo
export function isDomingo(data: string): boolean {
  const d = new Date(data + 'T12:00:00');
  return d.getDay() === 0;
}

// Gerar ID único simples
export function gerarId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Calcular distribuição por plataforma
export interface DistribuicaoPlataforma {
  plataformaId: string;
  nome: string;
  cor: string;
  icone: string;
  totalFaturamento: number;
  totalCorridas: number;
  totalKm: number;
  percentual: number;
  mediaPorCorrida: number;
  mediaPorKm: number;
}

export function calcularDistribuicaoPlataformas(
  records: DailyRecord[],
  plataformas: AppPlataforma[]
): DistribuicaoPlataforma[] {
  const ganhosPorApp = new Map<string, { faturamento: number; corridas: number; km: number }>();

  // Agregar ganhos de todos os registros
  for (const record of records) {
    if (!record.ganhosPorApp || record.ganhosPorApp.length === 0) continue;
    for (const ganho of record.ganhosPorApp) {
      const existing = ganhosPorApp.get(ganho.plataformaId) || { faturamento: 0, corridas: 0, km: 0 };
      existing.faturamento += ganho.faturamento;
      existing.corridas += ganho.numCorridas;
      existing.km += ganho.kmRodado;
      ganhosPorApp.set(ganho.plataformaId, existing);
    }
  }

  const totalGeral = Array.from(ganhosPorApp.values()).reduce((sum, g) => sum + g.faturamento, 0);

  const resultado: DistribuicaoPlataforma[] = [];
  for (const [id, dados] of ganhosPorApp) {
    const plataforma = plataformas.find(p => p.id === id);
    if (!plataforma) continue;
    resultado.push({
      plataformaId: id,
      nome: plataforma.nome,
      cor: plataforma.cor,
      icone: plataforma.icone,
      totalFaturamento: dados.faturamento,
      totalCorridas: dados.corridas,
      totalKm: dados.km,
      percentual: totalGeral > 0 ? (dados.faturamento / totalGeral) * 100 : 0,
      mediaPorCorrida: dados.corridas > 0 ? dados.faturamento / dados.corridas : 0,
      mediaPorKm: dados.km > 0 ? dados.faturamento / dados.km : 0,
    });
  }

  return resultado.sort((a, b) => b.totalFaturamento - a.totalFaturamento);
}

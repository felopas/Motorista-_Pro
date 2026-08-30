import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, TrendingUp, DollarSign, Clock, Gauge, Zap, Route, Trash2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import {
  formatarMoeda,
  getNomeMes,
  getDiaSemanaAbrev,
  calcularResumoMensal,
  calcularDistribuicaoPlataformas
} from '@/lib/calculations';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ReferenceLine,
} from 'recharts';

interface ChartTooltipPayloadItem {
  name: string;
  value: number;
  color?: string;
  fill?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipPayloadItem[];
  label?: string | number;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800/95 backdrop-blur-sm border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 shadow-xl">
        <p className="text-slate-500 dark:text-slate-400 text-[10px] mb-1">Dia {label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm font-semibold" style={{ color: p.color || p.fill }}>
            {p.name}: {formatarMoeda(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Tooltip para o comparativo mensal (label já é o mês, sem prefixo "Dia")
const MonthTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800/95 backdrop-blur-sm border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 shadow-xl">
        <p className="text-slate-500 dark:text-slate-400 text-[10px] mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm font-semibold" style={{ color: p.color || p.fill }}>
            {p.name}: {formatarMoeda(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface PieLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}

// Custom pie label
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: PieLabelProps) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return percent > 0.05 ? (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null;
};

export function History() {
  const { user, getMonthConfig, getRecordsByMonth, setCurrentView, setSelectedDate, deleteRecord } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleEditDay = (recordData: string) => {
    setSelectedDate(new Date(recordData));
    setCurrentView('register');
  };

  const handleDeleteDay = (id: string) => {
    deleteRecord(id);
    setConfirmDeleteId(null);
  };

  const monthRecords = getRecordsByMonth(selectedYear, selectedMonth);
  const monthConfig = getMonthConfig(selectedYear, selectedMonth);
  const resumo = monthConfig ? calcularResumoMensal(monthRecords, monthConfig) : null;

  // Dados do gráfico: Bruto vs Meta por dia
  const lucroPorDiaData = monthRecords
    .filter(r => !r.ehFolga)
    .map(r => ({
      dia: r.data.split('-')[2],
      bruto: r.faturamentoBruto,
      liquido: r.lucroLiquido,
      meta: monthConfig?.metaDiaria || 0,
    }))
    .sort((a, b) => Number(a.dia) - Number(b.dia));

  // Dados do gráfico: evolução acumulada
  const evolucaoData = monthRecords
    .filter(r => !r.ehFolga)
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    .reduce((acc, r, index) => {
      const brutoAcumulado = index === 0 ? r.faturamentoBruto : acc[index - 1].brutoAcumulado + r.faturamentoBruto;
      acc.push({
        dia: r.data.split('-')[2],
        brutoAcumulado,
        metaAcumulada: (monthConfig?.metaDiaria || 0) * (index + 1),
      });
      return acc;
    }, [] as { dia: string; brutoAcumulado: number; metaAcumulada: number }[]);

  // Distribuição financeira (Bruto = Lucro real + Custos Variáveis + Custos Fixos)
  const distribuicaoData = resumo ? [
    { name: 'Lucro Líquido', value: resumo.totalLucroComFixos, color: '#34d399' },
    { name: 'Custos Variáveis', value: resumo.totalCustosVariaveis, color: '#fb923c' },
    { name: 'Custos Fixos', value: resumo.custoFixoRateio, color: '#a78bfa' },
  ].filter(d => d.value > 0) : [];

  // Comparativo dos últimos 6 meses (incluindo o mês selecionado), pulando meses sem configuração
  const comparativoMeses = useMemo(() => {
    const alvo: { ano: number; mes: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      let mes = selectedMonth - i;
      let ano = selectedYear;
      while (mes < 1) {
        mes += 12;
        ano -= 1;
      }
      alvo.push({ ano, mes });
    }

    return alvo
      .map(({ ano, mes }) => {
        const config = getMonthConfig(ano, mes);
        if (!config) return null;
        const records = getRecordsByMonth(ano, mes);
        const resumoMes = calcularResumoMensal(records, config);
        return {
          label: `${getNomeMes(mes).slice(0, 3)}/${String(ano).slice(2)}`,
          lucro: resumoMes.totalLucroComFixos,
        };
      })
      .filter((d): d is { label: string; lucro: number } => d !== null);
  }, [selectedMonth, selectedYear, getMonthConfig, getRecordsByMonth]);

  // Distribuição por plataforma (hidden gracefully quando não há dados de ganhosPorApp)
  const distribuicaoApps = user?.plataformas
    ? calcularDistribuicaoPlataformas(monthRecords, user.plataformas)
    : [];

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pb-24">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg sticky top-0 z-40 pt-safe">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentView('dashboard')}
              className="text-slate-500 dark:text-slate-400"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Análise</h1>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4">
        {/* Seletor de Mês */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {getNomeMes(selectedMonth)} {selectedYear}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {resumo && monthRecords.length > 0 ? (
          <>
            {/* Cards de destaque com glassmorphism */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/20 p-4">
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl" />
                <DollarSign className="w-5 h-5 text-emerald-400 mb-2" />
                <p className="text-[10px] text-emerald-300/70 uppercase tracking-wider font-medium">Faturamento</p>
                <p className="text-xl font-bold text-emerald-400 mt-0.5">{formatarMoeda(resumo.totalBruto)}</p>
              </div>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/20 p-4">
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl" />
                <TrendingUp className="w-5 h-5 text-blue-400 mb-2" />
                <p className="text-[10px] text-blue-300/70 uppercase tracking-wider font-medium">Lucro Líq. (c/ fixos)</p>
                <p className={`text-xl font-bold mt-0.5 ${resumo.totalLucroComFixos >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                  {formatarMoeda(resumo.totalLucroComFixos)}
                </p>
              </div>
            </div>

            {/* Mini stats */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              <div className="bg-white dark:bg-slate-800/40 rounded-xl p-2.5 text-center border border-slate-200 dark:border-slate-700/50">
                <Clock className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
                <p className="text-sm font-bold text-slate-900 dark:text-white">{resumo.totalHoras.toFixed(0)}h</p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500">Horas</p>
              </div>
              <div className="bg-white dark:bg-slate-800/40 rounded-xl p-2.5 text-center border border-slate-200 dark:border-slate-700/50">
                <Route className="w-3.5 h-3.5 text-blue-400 mx-auto mb-1" />
                <p className="text-sm font-bold text-slate-900 dark:text-white">{resumo.totalKm.toFixed(0)}</p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500">KM</p>
              </div>
              <div className="bg-white dark:bg-slate-800/40 rounded-xl p-2.5 text-center border border-slate-200 dark:border-slate-700/50">
                <Zap className="w-3.5 h-3.5 text-purple-400 mx-auto mb-1" />
                <p className="text-sm font-bold text-slate-900 dark:text-white">{resumo.totalCorridas}</p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500">Corridas</p>
              </div>
              <div className="bg-white dark:bg-slate-800/40 rounded-xl p-2.5 text-center border border-slate-200 dark:border-slate-700/50">
                <Gauge className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-1" />
                <p className="text-sm font-bold text-slate-900 dark:text-white">{resumo.diasTrabalhados}</p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500">Dias</p>
              </div>
            </div>

            <Tabs defaultValue="graficos" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white dark:bg-slate-800/80 rounded-xl h-10 p-1">
                <TabsTrigger value="graficos" className="rounded-lg data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 text-sm font-medium">
                  📊 Gráficos
                </TabsTrigger>
                <TabsTrigger value="dias" className="rounded-lg data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 text-sm font-medium">
                  📅 Dias
                </TabsTrigger>
              </TabsList>

              <TabsContent value="graficos" className="space-y-4 mt-4">
                {/* Gráfico 1: Bruto x Meta — Barras com gradiente */}
                <Card className="bg-white dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/50 backdrop-blur-sm overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Faturamento por Dia</h3>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-full">
                        Meta: {formatarMoeda(monthConfig?.metaDiaria || 0)}
                      </span>
                    </div>
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={lucroPorDiaData} barCategoryGap="20%">
                          <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#34d399" stopOpacity={0.9} />
                              <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
                            </linearGradient>
                            <linearGradient id="barGradientBelow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#fb923c" stopOpacity={0.9} />
                              <stop offset="100%" stopColor="#ea580c" stopOpacity={0.6} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis
                            dataKey="dia"
                            stroke="#475569"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="#475569"
                            fontSize={9}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
                            width={35}
                          />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }} />
                          <ReferenceLine y={monthConfig?.metaDiaria || 0} stroke="#94a3b8" strokeDasharray="6 3" strokeWidth={1.5} />
                          <Bar dataKey="bruto" name="Bruto" radius={[6, 6, 0, 0]} maxBarSize={32}>
                            {lucroPorDiaData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.bruto >= (monthConfig?.metaDiaria || 0) ? 'url(#barGradient)' : 'url(#barGradientBelow)'}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Gráfico 2: Evolução acumulada — Área */}
                {evolucaoData.length > 1 && (
                  <Card className="bg-white dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/50 backdrop-blur-sm overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Evolução Acumulada</h3>
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          {formatarMoeda(evolucaoData[evolucaoData.length - 1]?.brutoAcumulado || 0)}
                        </span>
                      </div>
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={evolucaoData}>
                            <defs>
                              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="metaGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#64748b" stopOpacity={0.15} />
                                <stop offset="100%" stopColor="#64748b" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="dia" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} width={35} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="metaAcumulada" name="Meta" stroke="#64748b" fill="url(#metaGradient)" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                            <Area type="monotone" dataKey="brutoAcumulado" name="Bruto" stroke="#34d399" fill="url(#areaGradient)" strokeWidth={2.5} dot={{ fill: '#34d399', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#34d399', stroke: '#0f172a', strokeWidth: 2 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Gráfico 3: Distribuição Financeira — Donut estilizado */}
                {distribuicaoData.length > 0 && (
                  <Card className="bg-white dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/50 backdrop-blur-sm overflow-hidden">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Distribuição Financeira</h3>
                      <div className="flex items-center gap-3">
                        <div className="h-36 w-36 flex-shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={distribuicaoData}
                                cx="50%"
                                cy="50%"
                                innerRadius={32}
                                outerRadius={60}
                                paddingAngle={4}
                                dataKey="value"
                                labelLine={false}
                                label={renderCustomLabel}
                                stroke="none"
                              >
                                {distribuicaoData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex-1 space-y-3">
                          {distribuicaoData.map((item) => (
                            <div key={item.name}>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                  <span className="text-slate-500 dark:text-slate-400">{item.name}</span>
                                </div>
                                <span className="text-slate-900 dark:text-white font-semibold">{formatarMoeda(item.value)}</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    backgroundColor: item.color,
                                    width: `${(item.value / resumo.totalBruto) * 100}%`,
                                    opacity: 0.8,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Card de Eficiência com visual premium */}
                <Card className="bg-white dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/50 backdrop-blur-sm overflow-hidden">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Indicadores de Eficiência</h3>
                    <div className="space-y-3">
                      {[
                        {
                          label: 'Bruto por KM',
                          value: resumo.totalKm > 0 ? formatarMoeda(resumo.totalBruto / resumo.totalKm) : '—',
                          icon: <Route className="w-3.5 h-3.5" />,
                          color: 'text-emerald-400',
                          bg: 'bg-emerald-500/10',
                        },
                        {
                          label: 'Líquido por KM',
                          value: formatarMoeda(resumo.mediaLucroPorKm),
                          icon: <TrendingUp className="w-3.5 h-3.5" />,
                          color: 'text-blue-400',
                          bg: 'bg-blue-500/10',
                        },
                        {
                          label: 'Bruto por Hora',
                          value: resumo.totalHoras > 0 ? formatarMoeda(resumo.totalBruto / resumo.totalHoras) : '—',
                          icon: <Clock className="w-3.5 h-3.5" />,
                          color: 'text-amber-400',
                          bg: 'bg-amber-500/10',
                        },
                        {
                          label: 'Média por Corrida',
                          value: resumo.totalCorridas > 0 ? formatarMoeda(resumo.totalBruto / resumo.totalCorridas) : '—',
                          icon: <Zap className="w-3.5 h-3.5" />,
                          color: 'text-purple-400',
                          bg: 'bg-purple-500/10',
                        },
                      ].map((metric) => (
                        <div key={metric.label} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/30">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 ${metric.bg} rounded-lg flex items-center justify-center ${metric.color}`}>
                              {metric.icon}
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{metric.label}</span>
                          </div>
                          <span className={`text-sm font-bold ${metric.color}`}>{metric.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Ranking por App (some se não houver dados) */}
                {distribuicaoApps.length > 0 && (
                  <Card className="bg-white dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/50 backdrop-blur-sm overflow-hidden">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Ranking por App</h3>
                      <div className="space-y-2.5">
                        {distribuicaoApps.map((app, idx) => (
                          <div key={app.plataformaId} className="flex items-center gap-3">
                            <span className="text-xs text-slate-400 dark:text-slate-500 w-4">{idx + 1}º</span>
                            <span className="text-base">{app.icone}</span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-900 dark:text-white font-medium">{app.nome}</span>
                                <span className="text-sm text-emerald-600 dark:text-emerald-400 font-bold">{formatarMoeda(app.totalFaturamento)}</span>
                              </div>
                              <div className="flex gap-3 text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                <span>{app.percentual.toFixed(0)}% do total</span>
                                {app.totalCorridas > 0 && <span>{app.totalCorridas} corridas</span>}
                                {app.mediaPorKm > 0 && <span>R${app.mediaPorKm.toFixed(2)}/km</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Gráfico 4: Comparativo entre meses */}
                {comparativoMeses.length > 0 && (
                  <Card className="bg-white dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/50 backdrop-blur-sm overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Comparativo Mensal</h3>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-full">
                          Últimos {comparativoMeses.length} meses
                        </span>
                      </div>
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={comparativoMeses} barCategoryGap="25%">
                            <defs>
                              <linearGradient id="compGradientPos" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#34d399" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
                              </linearGradient>
                              <linearGradient id="compGradientNeg" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f87171" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#dc2626" stopOpacity={0.6} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="label" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis
                              stroke="#475569"
                              fontSize={9}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(v) => v >= 1000 || v <= -1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
                              width={35}
                            />
                            <Tooltip content={<MonthTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }} />
                            <ReferenceLine y={0} stroke="#475569" strokeWidth={1} />
                            <Bar dataKey="lucro" name="Lucro Líq." radius={[6, 6, 6, 6]} maxBarSize={28}>
                              {comparativoMeses.map((entry, index) => (
                                <Cell
                                  key={`comp-cell-${index}`}
                                  fill={entry.lucro >= 0 ? 'url(#compGradientPos)' : 'url(#compGradientNeg)'}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="dias" className="space-y-2 mt-4">
                {monthRecords
                  .filter(r => !r.ehFolga)
                  .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                  .map((record) => {
                    const metaDiaria = monthConfig?.metaDiaria || 0;
                    const atingiuMeta = record.faturamentoBruto >= metaDiaria;
                    const percentMeta = metaDiaria > 0 ? (record.faturamentoBruto / metaDiaria) * 100 : 0;

                    const isConfirming = confirmDeleteId === record.id;

                    return (
                      <Card key={record.id} className="bg-white dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/50 overflow-hidden">
                        <CardContent className="p-0">
                          <div className="flex items-stretch">
                            {/* Indicador de cor lateral */}
                            <div className={`w-1 flex-shrink-0 ${atingiuMeta ? 'bg-emerald-500' : record.faturamentoBruto >= metaDiaria * 0.8 ? 'bg-amber-500' : 'bg-red-500'}`} />
                            <button
                              type="button"
                              onClick={() => handleEditDay(record.data)}
                              className="flex-1 p-3 text-left"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-slate-900 dark:text-white font-semibold text-sm">
                                    {record.data.split('-')[2]}/{record.data.split('-')[1]}
                                    <span className="text-slate-400 dark:text-slate-500 font-normal ml-1.5 text-xs">{getDiaSemanaAbrev(record.data)}</span>
                                  </p>
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                    {record.horasTrabalhadas}h • {record.kmRodado}km
                                    {record.numCorridas ? ` • ${record.numCorridas} corridas` : ''}
                                  </p>
                                  {record.ganhosPorApp && record.ganhosPorApp.length > 0 && (
                                    <div className="flex gap-1 mt-1 flex-wrap">
                                      {record.ganhosPorApp.map(g => {
                                        const plat = user?.plataformas?.find(p => p.id === g.plataformaId);
                                        if (!plat) return null;
                                        return (
                                          <span
                                            key={g.plataformaId}
                                            className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400"
                                          >
                                            {plat.icone} {formatarMoeda(g.faturamento)}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-emerald-400 font-bold text-sm">
                                    {formatarMoeda(record.faturamentoBruto)}
                                  </p>
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                    Líq. {formatarMoeda(record.lucroLiquido)}
                                  </p>
                                  {monthConfig && monthConfig.custoFixoDiario > 0 && (
                                    <p className="text-[9px] text-slate-400 dark:text-slate-600">
                                      c/ fixos: {formatarMoeda(record.lucroLiquido - monthConfig.custoFixoDiario)}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {/* Mini barra de progresso vs meta */}
                              <div className="mt-2 flex items-center gap-2">
                                <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${atingiuMeta ? 'bg-emerald-500' : record.faturamentoBruto >= metaDiaria * 0.8 ? 'bg-amber-500' : 'bg-red-500'}`}
                                    style={{ width: `${Math.min(percentMeta, 100)}%` }}
                                  />
                                </div>
                                <span className={`text-[9px] font-medium ${atingiuMeta ? 'text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                  {percentMeta.toFixed(0)}%
                                </span>
                              </div>
                              {record.metaDiaDinamica != null && record.metaDiaDinamica > 0 ? (
                                <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">
                                  Meta do dia: <span className="text-slate-500 dark:text-slate-400 font-medium">{formatarMoeda(record.metaDiaDinamica)}</span>
                                </p>
                              ) : metaDiaria > 0 && (
                                <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">
                                  Meta do dia: <span className="text-slate-500 dark:text-slate-400 font-medium">{formatarMoeda(metaDiaria)}</span>
                                </p>
                              )}
                            </button>
                            {/* Ação de excluir */}
                            <div className="flex items-center pr-2">
                              {isConfirming ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDay(record.id)}
                                    className="text-[10px] font-semibold text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-2 py-1.5"
                                  >
                                    Confirmar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/40 rounded-lg px-2 py-1.5"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(record.id)}
                                  className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <Card className="bg-white dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/50">
            <CardContent className="p-10 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-slate-400 dark:text-slate-600" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhum registro neste mês</p>
              <p className="text-slate-400 dark:text-slate-600 text-sm mt-1">Registre seus dias para ver a análise aqui</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

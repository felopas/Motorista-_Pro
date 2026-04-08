import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, TrendingUp, DollarSign, Clock, Gauge, Zap, Route, Download } from 'lucide-react';
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

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-xl px-3 py-2 shadow-xl">
        <p className="text-slate-400 text-[10px] mb-1">Dia {label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm font-semibold" style={{ color: p.color || p.fill }}>
            {p.name}: {formatarMoeda(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Custom pie label
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
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
  const { user, getMonthConfig, getRecordsByMonth, setCurrentView } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isExporting, setIsExporting] = useState(false);

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

  // Distribuição financeira
  const distribuicaoData = resumo ? [
    { name: 'Lucro Líquido', value: resumo.totalLucro, color: '#34d399' },
    { name: 'Combustível', value: resumo.totalCustosVariaveis, color: '#fb923c' },
  ].filter(d => d.value > 0) : [];

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

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const element = document.getElementById('history-content');
      if (!element) return;
      
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0f172a' // bg-slate-900
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Native sharing via Capacitor se disponível
      try {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const { Share } = await import('@capacitor/share');
        
        const fileName = `motorista-pro-${getNomeMes(selectedMonth)}-${selectedYear}.pdf`;
        const base64Data = pdf.output('datauristring').split(',')[1];
        
        const result = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
        });
        
        if (result.uri) {
          await Share.share({
            title: 'Relatório Motorista Pro',
            text: `Relatório de ${getNomeMes(selectedMonth)}/${selectedYear}`,
            url: result.uri,
            dialogTitle: 'Salvar/Compartilhar PDF',
          });
          setIsExporting(false);
          return;
        }
      } catch (err) {
        console.log('Fallback para exportação PDF web');
      }

      // Web Fallback
      pdf.save(`motorista-pro-${getNomeMes(selectedMonth)}-${selectedYear}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF', err);
      alert('Ocorreu um erro ao gerar o PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24 transition-colors">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg sticky top-0 z-40 pt-safe border-b border-slate-200 dark:border-transparent">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentView('dashboard')}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Análise</h1>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4" id="history-content">
        {/* Seletor de Mês e Botão de Exportar */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center justify-between flex-1 mr-3">
            <button
              onClick={handlePrevMonth}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            {getNomeMes(selectedMonth)} {selectedYear}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700 w-10 h-10 shrink-0"
            onClick={handleExportPDF}
            disabled={isExporting || (!resumo && monthRecords.length === 0)}
          >
             <Download className="w-5 h-5" />
          </Button>
        </div>

        {resumo && monthRecords.length > 0 ? (
          <>
            {/* Cards de destaque com glassmorphism */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 dark:from-emerald-500/20 to-emerald-100 dark:to-emerald-600/5 border border-emerald-200 dark:border-emerald-500/20 p-4">
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-emerald-200/50 dark:bg-emerald-500/10 rounded-full blur-xl" />
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-2" />
                <p className="text-[10px] text-emerald-700 dark:text-emerald-300/70 uppercase tracking-wider font-medium">Faturamento</p>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">{formatarMoeda(resumo.totalBruto)}</p>
              </div>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 dark:from-blue-500/20 to-blue-100 dark:to-blue-600/5 border border-blue-200 dark:border-blue-500/20 p-4">
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-blue-200/50 dark:bg-blue-500/10 rounded-full blur-xl" />
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-2" />
                <p className="text-[10px] text-blue-700 dark:text-blue-300/70 uppercase tracking-wider font-medium">Lucro Líquido</p>
                <p className={`text-xl font-bold mt-0.5 ${resumo.totalLucro >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatarMoeda(resumo.totalLucro)}
                </p>
              </div>
            </div>

            {/* Mini stats */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              <div className="bg-white dark:bg-slate-800/40 rounded-xl p-2.5 text-center border border-slate-200 dark:border-slate-700/50 shadow-sm">
                <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 mx-auto mb-1" />
                <p className="text-sm font-bold text-slate-800 dark:text-white">{resumo.totalHoras.toFixed(0)}h</p>
                <p className="text-[9px] text-slate-500 dark:text-slate-500">Horas</p>
              </div>
              <div className="bg-white dark:bg-slate-800/40 rounded-xl p-2.5 text-center border border-slate-200 dark:border-slate-700/50 shadow-sm">
                <Route className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 mx-auto mb-1" />
                <p className="text-sm font-bold text-slate-800 dark:text-white">{resumo.totalKm.toFixed(0)}</p>
                <p className="text-[9px] text-slate-500 dark:text-slate-500">KM</p>
              </div>
              <div className="bg-white dark:bg-slate-800/40 rounded-xl p-2.5 text-center border border-slate-200 dark:border-slate-700/50 shadow-sm">
                <Zap className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 mx-auto mb-1" />
                <p className="text-sm font-bold text-slate-800 dark:text-white">{resumo.totalCorridas}</p>
                <p className="text-[9px] text-slate-500 dark:text-slate-500">Corridas</p>
              </div>
              <div className="bg-white dark:bg-slate-800/40 rounded-xl p-2.5 text-center border border-slate-200 dark:border-slate-700/50 shadow-sm">
                <Gauge className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 mx-auto mb-1" />
                <p className="text-sm font-bold text-slate-800 dark:text-white">{resumo.diasTrabalhados}</p>
                <p className="text-[9px] text-slate-500 dark:text-slate-500">Dias</p>
              </div>
            </div>

            <Tabs defaultValue="graficos" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-200/50 dark:bg-slate-800/80 rounded-xl h-10 p-1">
                <TabsTrigger value="graficos" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 text-sm font-medium">
                  📊 Gráficos
                </TabsTrigger>
                <TabsTrigger value="dias" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 text-sm font-medium">
                  📅 Dias
                </TabsTrigger>
              </TabsList>

              <TabsContent value="graficos" className="space-y-4 mt-4">
                {/* Gráfico 1: Bruto x Meta — Barras com gradiente */}
                <Card className="bg-white dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/50 backdrop-blur-sm overflow-hidden shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Faturamento por Dia</h3>
                      <span className="text-[10px] text-slate-600 dark:text-slate-500 bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-full">
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
                  <Card className="bg-white dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/50 backdrop-blur-sm overflow-hidden shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Evolução Acumulada</h3>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
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
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} className="dark:stroke-slate-800" />
                            <XAxis dataKey="dia" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} className="dark:stroke-slate-400" />
                            <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} width={35} className="dark:stroke-slate-400" />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="metaAcumulada" name="Meta" stroke="#94a3b8" fill="url(#metaGradient)" strokeWidth={1.5} strokeDasharray="4 2" dot={false} className="dark:stroke-slate-500" />
                            <Area type="monotone" dataKey="brutoAcumulado" name="Bruto" stroke="#10b981" fill="url(#areaGradient)" strokeWidth={2.5} dot={{ fill: '#10b981', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }} className="dark:stroke-emerald-400" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Gráfico 3: Distribuição Financeira — Donut estilizado */}
                {distribuicaoData.length > 0 && (
                  <Card className="bg-white dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/50 backdrop-blur-sm overflow-hidden shadow-sm">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Distribuição Financeira</h3>
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
                                  <span className="text-slate-600 dark:text-slate-400">{item.name}</span>
                                </div>
                                <span className="text-slate-800 dark:text-white font-semibold">{formatarMoeda(item.value)}</span>
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
                <Card className="bg-white dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/50 backdrop-blur-sm overflow-hidden shadow-sm">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Indicadores de Eficiência</h3>
                    <div className="space-y-3">
                      {[
                        {
                          label: 'Bruto por KM',
                          value: resumo.totalKm > 0 ? formatarMoeda(resumo.totalBruto / resumo.totalKm) : '—',
                          icon: <Route className="w-3.5 h-3.5" />,
                          color: 'text-emerald-600 dark:text-emerald-400',
                          bg: 'bg-emerald-50 dark:bg-emerald-500/10',
                        },
                        {
                          label: 'Líquido por KM',
                          value: formatarMoeda(resumo.mediaLucroPorKm),
                          icon: <TrendingUp className="w-3.5 h-3.5" />,
                          color: 'text-blue-600 dark:text-blue-400',
                          bg: 'bg-blue-50 dark:bg-blue-500/10',
                        },
                        {
                          label: 'Bruto por Hora',
                          value: resumo.totalHoras > 0 ? formatarMoeda(resumo.totalBruto / resumo.totalHoras) : '—',
                          icon: <Clock className="w-3.5 h-3.5" />,
                          color: 'text-amber-600 dark:text-amber-400',
                          bg: 'bg-amber-50 dark:bg-amber-500/10',
                        },
                        {
                          label: 'Média por Corrida',
                          value: resumo.totalCorridas > 0 ? formatarMoeda(resumo.totalBruto / resumo.totalCorridas) : '—',
                          icon: <Zap className="w-3.5 h-3.5" />,
                          color: 'text-purple-600 dark:text-purple-400',
                          bg: 'bg-purple-50 dark:bg-purple-500/10',
                        },
                      ].map((metric) => (
                        <div key={metric.label} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/30">
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

                {/* Card de Ranking por App */}
                {(() => {
                  const distApps = user?.plataformas
                    ? calcularDistribuicaoPlataformas(monthRecords, user.plataformas)
                    : [];
                  if (distApps.length === 0) return null;
                  return (
                    <Card className="bg-white dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/50 backdrop-blur-sm overflow-hidden shadow-sm">
                      <CardContent className="p-4">
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Ranking por App</h3>
                        <div className="space-y-2.5">
                          {distApps.map((app, idx) => (
                            <div key={app.plataformaId} className="flex items-center gap-3">
                              <span className="text-xs text-slate-500 w-4">{idx + 1}º</span>
                              <span className="text-base">{app.icone}</span>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-slate-800 dark:text-white font-medium">{app.nome}</span>
                                  <span className="text-sm text-emerald-600 dark:text-emerald-400 font-bold">{formatarMoeda(app.totalFaturamento)}</span>
                                </div>
                                <div className="flex gap-3 text-[10px] text-slate-500 mt-0.5">
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
                  );
                })()}
              </TabsContent>

              <TabsContent value="dias" className="space-y-2 mt-4">
                {monthRecords
                  .filter(r => !r.ehFolga)
                  .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                  .map((record) => {
                    const metaDiaria = monthConfig?.metaDiaria || 0;
                    const atingiuMeta = record.faturamentoBruto >= metaDiaria;
                    const percentMeta = metaDiaria > 0 ? (record.faturamentoBruto / metaDiaria) * 100 : 0;

                    return (
                      <Card key={record.id} className="bg-white dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/50 overflow-hidden shadow-sm">
                        <CardContent className="p-0">
                          <div className="flex items-stretch">
                            {/* Indicador de cor lateral */}
                            <div className={`w-1 flex-shrink-0 ${atingiuMeta ? 'bg-emerald-500' : record.faturamentoBruto >= metaDiaria * 0.8 ? 'bg-amber-500' : 'bg-red-500'}`} />
                            <div className="flex-1 p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-slate-800 dark:text-white font-semibold text-sm">
                                    {record.data.split('-')[2]}/{record.data.split('-')[1]}
                                    <span className="text-slate-500 font-normal ml-1.5 text-xs">{getDiaSemanaAbrev(record.data)}</span>
                                  </p>
                                  <p className="text-[10px] text-slate-500 mt-0.5">
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
                                            className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400"
                                          >
                                            {plat.icone} {formatarMoeda(g.faturamento)}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                                    {formatarMoeda(record.faturamentoBruto)}
                                  </p>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-500">
                                    Líq. {formatarMoeda(record.lucroLiquido)}
                                  </p>
                                </div>
                              </div>
                              {/* Mini barra de progresso vs meta */}
                              <div className="mt-2 flex items-center gap-2">
                                <div className="flex-1 h-1 bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${atingiuMeta ? 'bg-emerald-500' : record.faturamentoBruto >= metaDiaria * 0.8 ? 'bg-amber-500' : 'bg-red-500'}`}
                                    style={{ width: `${Math.min(percentMeta, 100)}%` }}
                                  />
                                </div>
                                <span className={`text-[9px] font-medium ${atingiuMeta ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-500'}`}>
                                  {percentMeta.toFixed(0)}%
                                </span>
                              </div>
                              {record.metaDiaDinamica != null && record.metaDiaDinamica > 0 ? (
                                <p className="text-[9px] text-slate-500 mt-1">
                                  Meta do dia: <span className="text-slate-600 dark:text-slate-400 font-medium">{formatarMoeda(record.metaDiaDinamica)}</span>
                                </p>
                              ) : metaDiaria > 0 && (
                                <p className="text-[9px] text-slate-500 mt-1">
                                  Meta do dia: <span className="text-slate-600 dark:text-slate-400 font-medium">{formatarMoeda(metaDiaria)}</span>
                                </p>
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
          <Card className="bg-white dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/50 shadow-sm">
            <CardContent className="p-10 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-slate-400 dark:text-slate-600" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-medium">Nenhum registro neste mês</p>
              <p className="text-slate-400 dark:text-slate-600 text-sm mt-1">Registre seus dias para ver a análise aqui</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div >
  );
}

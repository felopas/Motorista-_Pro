import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/Calendar';
import { useApp } from '@/contexts/AppContext';
import {
  Plus,
  Settings,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import {
  calcularResumoMensal,
  formatarMoeda,
  getNomeMes
} from '@/lib/calculations';

export function Dashboard() {
  const {
    user,
    getMonthConfig,
    hasMonthConfig,
    getRecordsByMonth,
    setCurrentView,
    selectedDate,
    setSelectedDate
  } = useApp();

  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());
  const [monthConfigAtual, setMonthConfigAtual] = useState<ReturnType<typeof getMonthConfig>>(null);

  useEffect(() => {
    const config = getMonthConfig(currentYear, currentMonth);
    setMonthConfigAtual(config);
  }, [currentYear, currentMonth, getMonthConfig]);

  const records = getRecordsByMonth(currentYear, currentMonth);
  const resumo = monthConfigAtual ? calcularResumoMensal(records, monthConfigAtual) : null;

  const needsConfig = !hasMonthConfig(currentYear, currentMonth);

  const handleChangeMonth = (delta: number) => {
    let newMonth = currentMonth + delta;
    let newYear = currentYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }

    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    setSelectedDate(new Date(newYear, newMonth - 1, 1));
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(new Date(date));
    setCurrentView('register');
  };

  const handleRegisterToday = () => {
    setSelectedDate(new Date());
    setCurrentView('register');
  };

  const handleConfigurarMes = () => {
    setSelectedDate(new Date(currentYear, currentMonth - 1, 1));
    setCurrentView('monthConfig');
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
      {/* Header compacto */}
      <div className="bg-slate-900/80 backdrop-blur-lg z-40 pt-safe">
        <div className="max-w-md mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Motorista Pro</h1>
              <p className="text-xs text-slate-400">
                {user ? `Olá, ${user.nome.split(' ')[0]}` : 'Bem-vindo'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentView('settings')}
              className="text-slate-400 hover:text-white h-9 w-9"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo principal - flex-1 para ocupar espaço restante */}
      <div className="flex-1 max-w-md mx-auto px-3 pt-2 pb-2 flex flex-col gap-2 overflow-hidden w-full">
        {/* Alerta de Configuração */}
        {needsConfig && (
          <Card className="bg-amber-500/10 border-amber-500/30 flex-shrink-0">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <p className="text-sm text-amber-400 font-medium flex-1">
                  Configure {getNomeMes(currentMonth)}
                </p>
                <Button
                  onClick={handleConfigurarMes}
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium h-8 text-sm px-3"
                >
                  Configurar
                  <ChevronRight className="w-3 h-3 ml-0.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info: Dias e Médias */}
        {resumo && monthConfigAtual && (() => {
          // Ganho de hoje
          const hoje = new Date();
          const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
          const recordHoje = records.find(r => r.data === hojeStr);
          const ganhoHoje = recordHoje ? recordHoje.faturamentoBruto : 0;

          // Meta/Dia dinâmica: (meta mensal - bruto acumulado) / dias restantes
          const diasRestantes = monthConfigAtual.diasPlanejados - resumo.diasTrabalhados;
          const faltaGanhar = monthConfigAtual.metaMensal - resumo.totalBruto;
          const metaDiaDinamica = diasRestantes > 0 ? Math.max(0, faltaGanhar / diasRestantes) : 0;

          // Cor do ganho de hoje
          const metaRef = monthConfigAtual.metaDiaria;
          const corGanho = ganhoHoje >= metaRef
            ? 'text-emerald-400'
            : ganhoHoje >= metaRef * 0.8
              ? 'text-amber-400'
              : ganhoHoje > 0
                ? 'text-red-400'
                : 'text-slate-500';

          // Cor da meta dinâmica (verde se diminuiu, vermelho se aumentou)
          const corMeta = metaDiaDinamica <= metaRef
            ? 'text-emerald-400'
            : metaDiaDinamica <= metaRef * 1.2
              ? 'text-amber-400'
              : 'text-red-400';

          return (
            <Card className="bg-slate-800/50 border-slate-700 flex-shrink-0">
              <CardContent className="p-3">
                <div className="flex justify-between text-sm">
                  <div>
                    <p className="text-slate-400 text-[11px]">Dias Restantes</p>
                    <p className="text-white font-semibold text-base">{diasRestantes}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[11px]">Trabalhados</p>
                    <p className="text-white font-semibold text-base">{resumo.diasTrabalhados}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[11px]">Ganho Hoje</p>
                    <p className={`${corGanho} font-semibold text-base`}>
                      {formatarMoeda(ganhoHoje)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[11px]">Meta/Dia</p>
                    <p className={`${corMeta} font-semibold text-base`}>{formatarMoeda(metaDiaDinamica)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Progresso com valores */}
        {resumo && monthConfigAtual && (
          <Card className="bg-slate-800/50 border-slate-700 flex-shrink-0">
            <CardContent className="p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] text-slate-400">Progresso da Meta</span>
                <span className="text-sm font-bold text-white">
                  {formatarMoeda(resumo.totalBruto)} / {formatarMoeda(monthConfigAtual.metaMensal)}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
                  style={{ width: `${Math.min(resumo.percentualMeta, 100)}%` }}
                />
              </div>
              <p className="text-center text-base font-bold text-white mt-1">
                {resumo.percentualMeta.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        )}

        {/* Calendário - flex-1 para preencher o espaço */}
        <div className="flex-1 min-h-0">
          <Calendar
            ano={currentYear}
            mes={currentMonth}
            onChangeMonth={handleChangeMonth}
            onSelectDate={handleSelectDate}
          />
        </div>
      </div>

      {/* Botão Registrar Hoje - fixo acima do BottomNav */}
      <div className="flex-shrink-0 pb-16 px-4">
        <div className="max-w-md mx-auto">
          <Button
            onClick={handleRegisterToday}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 text-base font-semibold"
          >
            <Plus className="w-5 h-5" />
            Registrar Hoje
          </Button>
        </div>
      </div>
    </div>
  );
}

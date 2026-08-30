import { useApp } from '@/contexts/AppContext';
import { getNomeMes, formatarMoeda } from '@/lib/calculations';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  ano: number;
  mes: number;
  onChangeMonth: (delta: number) => void;
  onSelectDate: (date: string) => void;
}

export function Calendar({ ano, mes, onChangeMonth, onSelectDate }: CalendarProps) {
  const { getRecordsByMonth, getMonthConfig } = useApp();

  const records = getRecordsByMonth(ano, mes);
  const monthConfig = getMonthConfig(ano, mes);
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const primeiroDiaSemana = new Date(ano, mes - 1, 1).getDay();

  // Criar mapa de registros por data
  const recordsByDate = new Map(records.map(r => [r.data, r]));

  // Gerar dias do calendário
  type DiaCalendario = { dia: number; data: string; record: typeof records[0] | undefined; isFolga: boolean } | null;
  const diasCalendario: DiaCalendario[] = [];

  // Dias vazios no início
  for (let i = 0; i < primeiroDiaSemana; i++) {
    diasCalendario.push(null);
  }

  // Dias do mês
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const dataStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const record = recordsByDate.get(dataStr);
    const isFolga = monthConfig?.diasFolga.includes(dataStr) || false;

    diasCalendario.push({
      dia,
      data: dataStr,
      record,
      isFolga,
    });
  }

  const getDayColor = (item: DiaCalendario) => {
    if (!item) return 'bg-slate-700/50 text-slate-500';
    // Se tem registro, sempre mostrar cor baseada no bruto (mesmo em dia de folga)
    if (item.record) {
      const bruto = item.record.faturamentoBruto;
      // Usar meta dinâmica salva no registro, senão usar a meta fixa do mês
      const metaRef = item.record.metaDiaDinamica ?? monthConfig?.metaDiaria ?? 0;
      if (bruto >= metaRef) return 'bg-emerald-500/30 text-emerald-400 border-emerald-500/50';
      if (bruto >= metaRef * 0.8) return 'bg-amber-500/30 text-amber-400 border-amber-500/50';
      return 'bg-red-500/30 text-red-400 border-red-500/50';
    }
    if (item.isFolga) return 'bg-slate-700/50 text-slate-500';
    return 'bg-slate-800 text-slate-400 hover:bg-slate-700';
  };

  const isHoje = (dia: number) => {
    const hoje = new Date();
    return hoje.getDate() === dia &&
      hoje.getMonth() + 1 === mes &&
      hoje.getFullYear() === ano;
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-3">
      {/* Header do calendário */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => onChangeMonth(-1)}
          className="p-1.5 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-lg font-semibold text-white">
          {getNomeMes(mes)} {ano}
        </h3>
        <button
          onClick={() => onChangeMonth(1)}
          className="p-1.5 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
          <div key={dia} className="text-center text-xs text-slate-500 font-medium py-0.5">
            {dia}
          </div>
        ))}
      </div>

      {/* Grid de dias */}
      <div className="grid grid-cols-7 gap-0.5">
        {diasCalendario.map((item, index) => (
          <div key={index}>
            {item ? (
              <button
                onClick={() => onSelectDate(item.data)}
                className={`w-full aspect-square rounded-md flex flex-col items-center justify-center font-medium border transition-all ${getDayColor(item)
                  } ${isHoje(item.dia) ? 'ring-2 ring-blue-500' : ''}`}
              >
                <span className="text-xs leading-none">{item.dia}</span>
                {item.record && (
                  <span className="text-[8px] leading-none mt-0.5 opacity-90">
                    {formatarMoeda(item.record.faturamentoBruto).replace(/R\$\s?/, '')}
                  </span>
                )}
              </button>
            ) : (
              <div className="w-full aspect-square" />
            )}
          </div>
        ))}
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-2 mt-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded bg-emerald-500/30 border border-emerald-500/50" />
          <span className="text-slate-400">Bom</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded bg-amber-500/30 border border-amber-500/50" />
          <span className="text-slate-400">Regular</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded bg-red-500/30 border border-red-500/50" />
          <span className="text-slate-400">Ruim</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded bg-slate-700/50" />
          <span className="text-slate-400">Folga</span>
        </div>
      </div>
    </div>
  );
}

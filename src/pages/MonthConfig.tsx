import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Calendar, Target, AlertTriangle, DollarSign, Check } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import type { MonthConfig } from '@/types';
import { getDiasUteis, calcularMetaDiaria, getNomeMes, formatarMoeda } from '@/lib/calculations';

export function MonthConfigPage() {
  const { saveMonthConfig, setCurrentView, selectedDate, getMonthConfig } = useApp();
  
  const anoInicial = selectedDate.getFullYear();
  const mesInicial = selectedDate.getMonth() + 1;
  
  const [ano, setAno] = useState(anoInicial);
  const [mes, setMes] = useState(mesInicial);
  const [diasPlanejados, setDiasPlanejados] = useState(20);
  const [diasFolga, setDiasFolga] = useState<string[]>([]);
  const [metaMensal, setMetaMensal] = useState(11000);
  const [showSuccess, setShowSuccess] = useState(false);

  const diasNoMes = new Date(ano, mes, 0).getDate();
  const diasUteis = getDiasUteis(ano, mes);
  
  useEffect(() => {
    const configExistente = getMonthConfig(ano, mes);
    if (configExistente) {
      setDiasPlanejados(configExistente.diasPlanejados);
      setDiasFolga(configExistente.diasFolga);
      setMetaMensal(configExistente.metaMensal);
    } else {
      const domingos: string[] = [];
      for (let dia = 1; dia <= diasNoMes; dia++) {
        const data = new Date(ano, mes - 1, dia);
        if (data.getDay() === 0) {
          domingos.push(`${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`);
        }
      }
      setDiasFolga(domingos);
      setDiasPlanejados(diasUteis - domingos.length);
    }
  }, [ano, mes, getMonthConfig, diasNoMes, diasUteis]);

  const toggleFolga = (dia: number) => {
    const dataStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    if (diasFolga.includes(dataStr)) {
      setDiasFolga(diasFolga.filter(d => d !== dataStr));
      setDiasPlanejados(diasPlanejados + 1);
    } else {
      setDiasFolga([...diasFolga, dataStr]);
      setDiasPlanejados(Math.max(0, diasPlanejados - 1));
    }
  };

  const handleSave = () => {
    const config: MonthConfig = {
      ano,
      mes,
      diasPlanejados,
      diasFolga,
      metaMensal,
      metaDiaria: calcularMetaDiaria(metaMensal, diasPlanejados),
      custoFixoDiario: 0,
    };
    saveMonthConfig(config);
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
      setCurrentView('dashboard');
    }, 1500);
  };

  const metaDiaria = calcularMetaDiaria(metaMensal, diasPlanejados);

  const diasCalendario = [];
  const primeiroDia = new Date(ano, mes - 1, 1).getDay();
  
  for (let i = 0; i < primeiroDia; i++) {
    diasCalendario.push(null);
  }
  
  for (let dia = 1; dia <= diasNoMes; dia++) {
    diasCalendario.push(dia);
  }

  const isDiaFolga = (dia: number) => {
    const dataStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    return diasFolga.includes(dataStr);
  };

  const meses = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  const handleChangeMes = (novoMes: number) => {
    setMes(novoMes);
  };

  const handleChangeAno = (delta: number) => {
    setAno(ano + delta);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Configurado!</h2>
          <p className="text-slate-400">{getNomeMes(mes)} de {ano} está pronto</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-24">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-lg sticky top-0 z-40 pt-safe">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentView('dashboard')}
              className="text-slate-400"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">Configurar Mês</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4">
        {/* Seletor de Mês */}
        <Card className="bg-slate-800/50 border-slate-700 mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => handleChangeAno(-1)}
                className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white"
              >
                ←
              </button>
              <span className="text-lg font-semibold text-white">{ano}</span>
              <button
                onClick={() => handleChangeAno(1)}
                className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white"
              >
                →
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {meses.map((nomeMes, index) => {
                const mesNum = index + 1;
                const isSelected = mes === mesNum;
                return (
                  <button
                    key={mesNum}
                    onClick={() => handleChangeMes(mesNum)}
                    className={`py-2 px-1 rounded-lg text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {nomeMes}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Meta Mensal */}
        <Card className="bg-slate-800/50 border-slate-700 mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              Meta de Faturamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Quanto quer faturar em {getNomeMes(mes)}?</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="number"
                  value={metaMensal}
                  onChange={(e) => setMetaMensal(Number(e.target.value))}
                  className="pl-10 bg-slate-900 border-slate-600 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dias de Trabalho */}
        <Card className="bg-slate-800/50 border-slate-700 mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              Dias de Trabalho
            </CardTitle>
            <CardDescription className="text-slate-400">
              Toque nos dias para marcar como folga
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
                  <div key={dia} className="text-xs text-slate-500 font-medium py-1">{dia}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {diasCalendario.map((dia, index) => (
                  <div key={index} className="aspect-square">
                    {dia && (
                      <button
                        onClick={() => toggleFolga(dia)}
                        className={`w-full h-full rounded-lg text-sm font-medium transition-all ${
                          isDiaFolga(dia)
                            ? 'bg-slate-600 text-slate-400'
                            : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                        }`}
                      >
                        {dia}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-500/20" />
                <span className="text-slate-400">Trabalho</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-slate-600" />
                <span className="text-slate-400">Folga</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo */}
        <Card className="bg-slate-800/50 border-slate-700 mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white">Resumo de {getNomeMes(mes)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Dias trabalhando:</span>
              <span className="text-white font-medium">{diasPlanejados} dias</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Dias de folga:</span>
              <span className="text-white font-medium">{diasFolga.length} dias</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Meta Bruta/Dia:</span>
              <span className="text-emerald-400 font-bold">{formatarMoeda(metaDiaria)}</span>
            </div>
            
            {metaDiaria > (metaMensal / diasUteis) * 1.2 && (
              <div className="flex items-start gap-2 bg-amber-500/10 rounded-lg p-3 mt-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-400">
                  Sua meta diária está {Math.round((metaDiaria / (metaMensal / diasUteis) - 1) * 100)}% maior que o normal devido aos dias de folga.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botões */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setCurrentView('dashboard')}
            className="flex-1 border-slate-600 text-slate-300"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Salvar Configuração
          </Button>
        </div>
      </div>
    </div>
  );
}

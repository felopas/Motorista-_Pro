import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, DollarSign, Gauge, Clock, Car, Check, Moon, Utensils, Receipt, Trash2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import type { DailyRecord } from '@/types';
import {
  gerarId,
  calcularLucroLiquido,
  calcularResumoMensal,
  formatarMoeda,
  getDiaSemanaAbrev
} from '@/lib/calculations';

interface RegisterProps {
  date?: string;
}

export function Register({ date }: RegisterProps = {}) {
  const { user, monthConfig, addRecord, deleteRecord, getRecordByDate, setCurrentView, selectedDate, getRecordsByMonth, getMonthConfig } = useApp();

  const initialDate = date || selectedDate.toISOString().split('T')[0];
  const [dataRegistro] = useState(initialDate);
  const [existingRecord] = useState<DailyRecord | undefined>(() => getRecordByDate(initialDate));
  const isEditMode = !!existingRecord;

  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Folga
  const [ehFolga, setEhFolga] = useState(existingRecord?.ehFolga ?? false);

  // Step 1: Faturamento
  const [faturamentoBruto, setFaturamentoBruto] = useState(
    existingRecord && !existingRecord.ehFolga ? String(existingRecord.faturamentoBruto) : ''
  );

  // Step 2: Dados da Jornada
  const [kmRodado, setKmRodado] = useState(
    existingRecord && !existingRecord.ehFolga ? String(existingRecord.kmRodado) : ''
  );
  const [horasTrabalhadas, setHorasTrabalhadas] = useState(
    existingRecord && !existingRecord.ehFolga ? String(existingRecord.horasTrabalhadas) : ''
  );
  const [numCorridas, setNumCorridas] = useState(
    existingRecord && !existingRecord.ehFolga && existingRecord.numCorridas ? String(existingRecord.numCorridas) : ''
  );
  const [custoAlimentacao, setCustoAlimentacao] = useState(
    existingRecord && existingRecord.custoAlimentacao ? String(existingRecord.custoAlimentacao) : ''
  );
  const [custoOutros, setCustoOutros] = useState(
    existingRecord && existingRecord.custoOutros ? String(existingRecord.custoOutros) : ''
  );

  const [showSuccess, setShowSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Ref para scroll
  const contentRef = useRef<HTMLDivElement>(null);

  // Scroll para topo quando muda de etapa
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [step]);

  // Cálculos
  const bruto = Number(faturamentoBruto) || 0;
  const km = Number(kmRodado) || 0;
  const horas = Number(horasTrabalhadas) || 0;
  const alimentacao = Number(custoAlimentacao) || 0;
  const outros = Number(custoOutros) || 0;

  // Calcular custo de combustível baseado na média do carro
  const calcularCustoCombustivel = () => {
    if (!user || km === 0) return 0;
    const litrosUsados = km / user.mediaGasolina;
    return litrosUsados * (user.precoCombustivel || 5.5);
  };

  const custoCombustivel = calcularCustoCombustivel();
  const custoTotal = custoCombustivel + alimentacao + outros;
  const lucroLiquido = calcularLucroLiquido(bruto, custoTotal);
  const metaDiariaOriginal = monthConfig?.metaDiaria || 0;

  // Calcular meta dinâmica do dia
  const calcularMetaDinamica = () => {
    if (!monthConfig) return metaDiariaOriginal;
    const [anoReg, mesReg] = dataRegistro.split('-').map(Number);
    const config = getMonthConfig(anoReg, mesReg);
    if (!config) return metaDiariaOriginal;
    const registrosMes = getRecordsByMonth(anoReg, mesReg);
    // Excluir registro do dia atual (se existir) para recalcular
    const registrosSemHoje = registrosMes.filter(r => r.data !== dataRegistro);
    const resumo = calcularResumoMensal(registrosSemHoje, config);
    const diasRestantes = config.diasPlanejados - resumo.diasTrabalhados;
    if (diasRestantes <= 0) return 0;
    const faltaGanhar = config.metaMensal - resumo.totalBruto;
    return Math.max(0, faltaGanhar / diasRestantes);
  };

  const metaDiaDinamica = calcularMetaDinamica();
  const metaDiaria = metaDiaDinamica; // Usar a meta dinâmica em todo o registro

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const canProceed = () => {
    if (ehFolga) return true;
    switch (step) {
      case 1: return bruto > 0;
      case 2: return km > 0 && horas > 0;
      case 3: return true;
      default: return false;
    }
  };

  const handleSubmit = () => {
    if (!ehFolga && (!bruto || !horas)) return;

    const record: DailyRecord = ehFolga
      ? {
        id: existingRecord?.id || gerarId(),
        data: dataRegistro,
        faturamentoBruto: 0,
        kmRodado: 0,
        horasTrabalhadas: 0,
        numCorridas: 0,
        custoCombustivel: 0,
        custoAlimentacao: 0,
        custoOutros: 0,
        custoTotal: 0,
        lucroLiquido: 0,
        ehFolga: true,
        metaDiaDinamica: metaDiaDinamica,
      }
      : {
        id: existingRecord?.id || gerarId(),
        data: dataRegistro,
        faturamentoBruto: bruto,
        kmRodado: km,
        horasTrabalhadas: horas,
        numCorridas: Number(numCorridas) || 0,
        custoCombustivel,
        custoAlimentacao: alimentacao,
        custoOutros: outros,
        custoTotal,
        lucroLiquido,
        ehFolga: false,
        metaDiaDinamica: metaDiaDinamica,
      };

    addRecord(record);
    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
      setCurrentView('dashboard');
    }, 2000);
  };

  const handleDelete = () => {
    if (!existingRecord) return;
    deleteRecord(existingRecord.id);
    setCurrentView('dashboard');
  };

  const formatarData = (dataStr: string) => {
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  // Progress bar
  const progress = (step / totalSteps) * 100;

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{isEditMode ? 'Atualizado!' : 'Registrado!'}</h2>
          <p className="text-slate-500 dark:text-slate-400">
            {isEditMode ? 'Seu registro foi atualizado com sucesso' : 'Seu dia foi salvo com sucesso'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col">
      {/* Header fixo */}
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
            <div className="flex-1">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">{isEditMode ? 'Editar Turno' : 'Registrar Turno'}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">{formatarData(dataRegistro)} • {getDiaSemanaAbrev(dataRegistro)}</p>
            </div>
            {isEditMode && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo scrollável */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto pb-32"
      >
        <div className="max-w-md mx-auto px-4 py-4">
          {/* Confirmação de exclusão */}
          {showDeleteConfirm && (
            <Card className="mb-4 bg-red-500/10 border-red-500/30">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm text-red-400 text-center">
                  Excluir este registro? Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 border-slate-300 dark:border-slate-600 text-slate-300"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleDelete}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mb-2">
              <span>Passo {step} de {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Preview do Bruto vs Meta */}
          {step > 1 && !ehFolga && bruto > 0 && (
            <Card className={`mb-4 border-2 ${bruto >= metaDiaria
              ? 'bg-emerald-500/10 border-emerald-500/50'
              : bruto >= metaDiaria * 0.8
                ? 'bg-amber-500/10 border-amber-500/50'
                : 'bg-red-500/10 border-red-500/50'
              }`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Faturamento Bruto</p>
                    <p className={`text-xl font-bold ${bruto >= metaDiaria ? 'text-emerald-400' : bruto >= metaDiaria * 0.8 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                      {formatarMoeda(bruto)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Meta Bruta</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {formatarMoeda(metaDiaria)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 1: Faturamento */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setEhFolga(!ehFolga)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${ehFolga
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    : 'bg-white dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                  <Moon className="w-4 h-4" />
                  {ehFolga ? 'Dia marcado como folga' : 'Marcar como folga'}
                </button>
              </div>

              {ehFolga ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Moon className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Dia de Folga</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Nenhum valor será registrado para este dia</p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-2">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <DollarSign className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Quanto você faturou?</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Informe o valor total do seu faturamento bruto</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300 text-lg">Faturamento Bruto</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-slate-400 dark:text-slate-500">R$</span>
                      <Input
                        type="number"
                        value={faturamentoBruto}
                        onChange={(e) => setFaturamentoBruto(e.target.value)}
                        placeholder="0,00"
                        className="pl-14 pr-4 py-6 text-3xl font-bold bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-center"
                        autoFocus
                      />
                    </div>
                  </div>

                  {bruto > 0 && (
                    <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Meta Dinâmica do Dia</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">{formatarMoeda(metaDiaDinamica)}</p>
                      {bruto < metaDiaria && (
                        <p className="text-xs text-amber-400 mt-1">
                          Faltam {formatarMoeda(metaDiaria - bruto)} para bater a meta
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* STEP 2: Dados da Jornada */}
          {step === 2 && (
            ehFolga ? (
              <div className="text-center py-12">
                <Moon className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400">Dia de folga — sem dados de jornada para preencher</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Gauge className="w-8 h-8 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Dados da Jornada</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Quanto você trabalhou hoje?</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300 flex items-center gap-2">
                      <Gauge className="w-4 h-4" /> Quilômetros rodados
                    </Label>
                    <Input
                      type="number"
                      value={kmRodado}
                      onChange={(e) => setKmRodado(e.target.value)}
                      placeholder="Ex: 210"
                      className="bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white py-5"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Horas trabalhadas
                    </Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={horasTrabalhadas}
                      onChange={(e) => setHorasTrabalhadas(e.target.value)}
                      placeholder="Ex: 8"
                      className="bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white py-5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300 flex items-center gap-2">
                      <Car className="w-4 h-4" /> Nº de corridas (opcional)
                    </Label>
                    <Input
                      type="number"
                      value={numCorridas}
                      onChange={(e) => setNumCorridas(e.target.value)}
                      placeholder="Ex: 15"
                      className="bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white py-5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300 flex items-center gap-2">
                      <Utensils className="w-4 h-4" /> Alimentação (opcional)
                    </Label>
                    <Input
                      type="number"
                      value={custoAlimentacao}
                      onChange={(e) => setCustoAlimentacao(e.target.value)}
                      placeholder="R$ 0,00"
                      className="bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white py-5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300 flex items-center gap-2">
                      <Receipt className="w-4 h-4" /> Outros gastos (opcional)
                    </Label>
                    <Input
                      type="number"
                      value={custoOutros}
                      onChange={(e) => setCustoOutros(e.target.value)}
                      placeholder="R$ 0,00"
                      className="bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white py-5"
                    />
                  </div>
                </div>

                {km > 0 && horas > 0 && (
                  <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Média por corrida:</span>
                      <span className="text-slate-900 dark:text-white">{numCorridas ? formatarMoeda(bruto / Number(numCorridas)) : '-'}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-slate-500 dark:text-slate-400">KM por hora:</span>
                      <span className="text-slate-900 dark:text-white">{(km / horas).toFixed(1)} km/h</span>
                    </div>
                    {user && (
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-slate-500 dark:text-slate-400">Custo combustível (est.):</span>
                        <span className="text-amber-400">{formatarMoeda(custoCombustivel)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          )}

          {/* STEP 3: Resumo Final — div única */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  {ehFolga ? <Moon className="w-7 h-7 text-emerald-400" /> : <Check className="w-7 h-7 text-emerald-400" />}
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{ehFolga ? 'Confirmar Folga' : 'Resumo do Dia'}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Confira antes de salvar</p>
              </div>

              {ehFolga ? (
                <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                  <CardContent className="p-4 text-center">
                    <p className="text-slate-900 dark:text-white font-semibold">Este dia será marcado como folga</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Nenhum valor financeiro será registrado</p>
                  </CardContent>
                </Card>
              ) : (
                /* Card único de resumo */
                <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                  <CardContent className="p-4 space-y-4">
                    {/* Dados da jornada em linha */}
                    <div className="flex justify-between text-sm">
                      <div className="text-center">
                        <p className="text-slate-500 dark:text-slate-400 text-xs">KM</p>
                        <p className="text-slate-900 dark:text-white font-bold">{km}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-500 dark:text-slate-400 text-xs">Horas</p>
                        <p className="text-slate-900 dark:text-white font-bold">{horas}h</p>
                      </div>
                      {numCorridas && (
                        <div className="text-center">
                          <p className="text-slate-500 dark:text-slate-400 text-xs">Corridas</p>
                          <p className="text-slate-900 dark:text-white font-bold">{numCorridas}</p>
                        </div>
                      )}
                      {user && (
                        <div className="text-center">
                          <p className="text-slate-500 dark:text-slate-400 text-xs">Média</p>
                          <p className="text-blue-400 font-bold">{user.mediaGasolina} km/l</p>
                        </div>
                      )}
                    </div>

                    {/* Separador */}
                    <div className="border-t border-slate-200 dark:border-slate-700" />

                    {/* Mini cálculo visual */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300 text-sm">Faturamento Bruto</span>
                        <span className="text-emerald-400 font-bold text-lg">{formatarMoeda(bruto)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400 text-sm">− Combustível (est.)</span>
                        <span className="text-amber-400 font-medium">- {formatarMoeda(custoCombustivel)}</span>
                      </div>
                      {alimentacao > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400 text-sm">− Alimentação</span>
                          <span className="text-amber-400 font-medium">- {formatarMoeda(alimentacao)}</span>
                        </div>
                      )}
                      {outros > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400 text-sm">− Outros gastos</span>
                          <span className="text-amber-400 font-medium">- {formatarMoeda(outros)}</span>
                        </div>
                      )}
                      <div className="border-t border-dashed border-slate-300 dark:border-slate-600 my-1" />
                      <div className={`flex justify-between items-center p-2 rounded-lg ${lucroLiquido >= metaDiaria
                        ? 'bg-emerald-500/10'
                        : lucroLiquido > 0
                          ? 'bg-amber-500/10'
                          : 'bg-red-500/10'
                        }`}>
                        <span className="text-slate-900 dark:text-white font-semibold text-sm">Lucro Líquido</span>
                        <span className={`font-bold text-xl ${lucroLiquido >= metaDiaria ? 'text-emerald-400' : lucroLiquido > 0 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                          {formatarMoeda(lucroLiquido)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Botões de Navegação fixos no bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 p-4 z-50">
        <div className="max-w-md mx-auto flex gap-3">
          {step > 1 ? (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1 border-slate-300 dark:border-slate-600 text-slate-300 py-5"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setCurrentView('dashboard')}
              className="flex-1 border-slate-300 dark:border-slate-600 text-slate-300 py-5"
            >
              Cancelar
            </Button>
          )}

          {step < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-5"
            >
              Avançar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-5"
            >
              <Check className="w-4 h-4 mr-2" />
              {isEditMode ? 'Salvar Alterações' : 'Finalizar'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

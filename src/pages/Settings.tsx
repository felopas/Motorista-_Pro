import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, User, Car, Fuel, DollarSign, Target, Download, Upload, Trash2, AlertTriangle, Check, Wrench, Plus, Sun, Moon, Bell, Smartphone } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useApp } from '@/contexts/AppContext';
import { exportData, importData } from '@/lib/storage';
import { solicitarPermissaoNotificacao } from '@/lib/notifications';
import { gerarId, formatarMoeda } from '@/lib/calculations';
import type { FixedCost } from '@/types';

const CORES_DISPONIVEIS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#14B8A6', '#EF4444', '#84CC16'];
const ICONES_DISPONIVEIS = ['🚗', '🚕', '🚙', '🛵', '🏍️', '🚐', '📦', '🍔'];

const categoriaLabels: Record<FixedCost['categoria'], string> = {
  seguro: 'Seguro',
  ipva: 'IPVA',
  financiamento: 'Financiamento',
  manutencao: 'Manutenção',
  outro: 'Outro',
};

export function Settings() {
  const { user, saveUser, resetAllData, setCurrentView, reminderEnabled, setReminderEnabled, reminderTime, setReminderTime, togglePlataforma, addPlataforma } = useApp();
  const { theme, setTheme } = useTheme();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reminderError, setReminderError] = useState('');

  // Plataformas
  const [showAddApp, setShowAddApp] = useState(false);
  const [novoAppNome, setNovoAppNome] = useState('');
  const [novoAppIcone, setNovoAppIcone] = useState('🚗');
  const [nome, setNome] = useState(user?.nome || '');
  const [carro, setCarro] = useState(user?.carro || '');
  const [mediaGasolina, setMediaGasolina] = useState(user?.mediaGasolina?.toString() || '12');
  const [precoCombustivel, setPrecoCombustivel] = useState(user?.precoCombustivel?.toString() || '5.5');
  const [metaMensalPadrao, setMetaMensalPadrao] = useState(user?.metaMensalPadrao?.toString() || '11000');

  const [custosFixos, setCustosFixos] = useState<FixedCost[]>(user?.custosFixos || []);
  const [novoDescricao, setNovoDescricao] = useState('');
  const [novoValor, setNovoValor] = useState('');
  const [novoCategoria, setNovoCategoria] = useState<FixedCost['categoria']>('outro');
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalCustosAtivos = custosFixos
    .filter((c) => c.ativo)
    .reduce((sum, c) => sum + c.valorMensal, 0);

  const persistCustos = (lista: FixedCost[]) => {
    if (!user) return;
    const total = lista.filter((c) => c.ativo).reduce((sum, c) => sum + c.valorMensal, 0);
    setCustosFixos(lista);
    saveUser({ ...user, custosFixos: lista, totalCustosFixos: total });
  };

  const handleAddCusto = () => {
    if (!novoDescricao.trim() || !novoValor) return;
    const novo: FixedCost = {
      id: gerarId(),
      descricao: novoDescricao.trim(),
      valorMensal: Number(novoValor) || 0,
      categoria: novoCategoria,
      ativo: true,
    };
    persistCustos([...custosFixos, novo]);
    setNovoDescricao('');
    setNovoValor('');
    setNovoCategoria('outro');
  };

  const handleToggleCusto = (id: string) => {
    persistCustos(custosFixos.map((c) => (c.id === id ? { ...c, ativo: !c.ativo } : c)));
  };

  const handleDeleteCusto = (id: string) => {
    persistCustos(custosFixos.filter((c) => c.id !== id));
  };

  const handleSave = () => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      nome,
      carro,
      mediaGasolina: Number(mediaGasolina) || 12,
      precoCombustivel: Number(precoCombustivel) || 5.5,
      metaMensalPadrao: Number(metaMensalPadrao) || 11000,
    };

    saveUser(updatedUser);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `motorista-pro-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    setImportError('');
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!window.confirm('Importar backup vai substituir todos os dados atuais. Deseja continuar?')) {
      return;
    }

    try {
      const text = await file.text();
      const success = importData(text);
      if (success) {
        window.location.reload();
      } else {
        setImportError('Não foi possível importar: arquivo de backup inválido.');
      }
    } catch {
      setImportError('Não foi possível importar: arquivo de backup inválido.');
    }
  };

  const handleDeleteAll = () => {
    resetAllData();
    setCurrentView('dashboard');
  };

  const handleAddPlataforma = () => {
    if (!novoAppNome.trim()) return;
    const corAleatoria = CORES_DISPONIVEIS[Math.floor(Math.random() * CORES_DISPONIVEIS.length)];
    addPlataforma(novoAppNome.trim(), novoAppIcone, corAleatoria);
    setNovoAppNome('');
    setNovoAppIcone('🚗');
    setShowAddApp(false);
  };

  const handleToggleReminder = async (checked: boolean) => {
    setReminderError('');
    if (!checked) {
      setReminderEnabled(false);
      return;
    }
    const permitido = await solicitarPermissaoNotificacao();
    if (!permitido) {
      setReminderError('Permissão de notificação negada. Ative em Ajustes do sistema para usar o lembrete.');
      return;
    }
    setReminderEnabled(true);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Salvo!</h2>
          <p className="text-slate-500 dark:text-slate-400">Suas configurações foram atualizadas</p>
        </div>
      </div>
    );
  }

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
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Configurações</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4">
        {/* Perfil */}
        <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-400" />
              Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-600 dark:text-slate-300">Aparência</Label>
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
                    theme === 'light'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  Claro
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
                    theme === 'dark'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  Escuro
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600 dark:text-slate-300">Nome</Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <Car className="w-4 h-4" /> Carro
              </Label>
              <Input
                value={carro}
                onChange={(e) => setCarro(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <Fuel className="w-4 h-4" /> Média do Carro (km/l)
              </Label>
              <Input
                type="number"
                step="0.1"
                value={mediaGasolina}
                onChange={(e) => setMediaGasolina(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
              />
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Esta média é usada apenas para novos registros. Dados salvos não serão alterados.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Preço do Combustível (R$/litro)
              </Label>
              <Input
                type="number"
                step="0.01"
                value={precoCombustivel}
                onChange={(e) => setPrecoCombustivel(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
              />
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Usado para estimar o custo de combustível em novos registros.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <Target className="w-4 h-4" /> Meta Mensal Padrão (R$)
              </Label>
              <Input
                type="number"
                step="1"
                value={metaMensalPadrao}
                onChange={(e) => setMetaMensalPadrao(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
              />
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Sugerida automaticamente ao configurar um mês novo — pode ser ajustada mês a mês.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Custos Fixos */}
        <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-emerald-400" />
              Custos Fixos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Cadastre seus custos mensais fixos (seguro, IPVA, financiamento, manutenção) para
              ratear no seu lucro diário.
            </p>

            {custosFixos.length > 0 && (
              <div className="space-y-2">
                {custosFixos.map((custo) => (
                  <div
                    key={custo.id}
                    className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${custo.ativo ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500 line-through'}`}>
                        {custo.descricao}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {categoriaLabels[custo.categoria]} · {formatarMoeda(custo.valorMensal)}/mês
                      </p>
                    </div>
                    <Switch
                      checked={custo.ativo}
                      onCheckedChange={() => handleToggleCusto(custo.id)}
                      className="data-[state=checked]:bg-emerald-600"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCusto(custo.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-3">
              <span className="text-sm text-slate-500 dark:text-slate-400">Total mensal (ativos)</span>
              <span className="text-sm font-semibold text-emerald-400">
                {formatarMoeda(totalCustosAtivos)}
              </span>
            </div>

            <div className="space-y-3 border-t border-slate-200 dark:border-slate-700 pt-4">
              <div className="space-y-2">
                <Label className="text-slate-600 dark:text-slate-300">Descrição</Label>
                <Input
                  value={novoDescricao}
                  onChange={(e) => setNovoDescricao(e.target.value)}
                  placeholder="Ex: Seguro do carro"
                  className="bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-slate-600 dark:text-slate-300">Valor Mensal (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={novoValor}
                    onChange={(e) => setNovoValor(e.target.value)}
                    placeholder="0,00"
                    className="bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600 dark:text-slate-300">Categoria</Label>
                  <Select
                    value={novoCategoria}
                    onValueChange={(v) => setNovoCategoria(v as FixedCost['categoria'])}
                  >
                    <SelectTrigger className="bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                      <SelectItem value="seguro">Seguro</SelectItem>
                      <SelectItem value="ipva">IPVA</SelectItem>
                      <SelectItem value="financiamento">Financiamento</SelectItem>
                      <SelectItem value="manutencao">Manutenção</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleAddCusto}
                disabled={!novoDescricao.trim() || !novoValor}
                className="w-full border-emerald-600/50 text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar Custo Fixo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Plataformas */}
        <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-400" />
              Plataformas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Ative os apps que você usa para registrar o faturamento separado por plataforma.
            </p>

            {user?.plataformas?.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePlataforma(p.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200 ${p.ativo
                  ? 'border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/5'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 opacity-60'
                  }`}
              >
                <span className="text-lg">{p.icone}</span>
                <span className={`font-medium text-sm flex-1 text-left ${p.ativo ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                  {p.nome}
                </span>
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: p.cor === '#000000' ? '#6b7280' : p.cor }}
                />
                {p.ativo && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              </button>
            ))}

            {showAddApp ? (
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700 mt-3">
                <div className="flex flex-wrap gap-1">
                  {ICONES_DISPONIVEIS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setNovoAppIcone(ic)}
                      className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all ${novoAppIcone === ic ? 'bg-emerald-100 dark:bg-emerald-500/20 ring-1 ring-emerald-500' : 'bg-slate-100 dark:bg-slate-800'
                        }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
                <Input
                  value={novoAppNome}
                  onChange={(e) => setNovoAppNome(e.target.value)}
                  placeholder="Nome do app"
                  className="bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddApp(false)}
                    className="flex-1 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm"
                    size="sm"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAddPlataforma}
                    disabled={!novoAppNome.trim()}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                    size="sm"
                  >
                    Adicionar
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowAddApp(true)}
                className="w-full border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mt-2"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar App
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Lembrete Diário */}
        <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-400" />
              Lembrete Diário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-700 dark:text-slate-300">Ativar lembrete</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Avisa se o dia ainda não foi registrado (só no app instalado no celular). Ao tocar na notificação, abre direto o registro do dia.
                </p>
              </div>
              <Switch
                checked={reminderEnabled}
                onCheckedChange={handleToggleReminder}
                className="data-[state=checked]:bg-emerald-600"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600 dark:text-slate-300">Horário do lembrete</Label>
              <Input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white w-32"
              />
            </div>
            {reminderError && (
              <p className="text-xs text-red-400">{reminderError}</p>
            )}
          </CardContent>
        </Card>

        {/* Ações */}
        <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-slate-900 dark:text-white">Dados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              onClick={handleExport}
              className="w-full border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar Backup
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleImportFile}
            />
            <Button
              variant="outline"
              onClick={handleImportClick}
              className="w-full border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Importar Backup
            </Button>
            {importError && (
              <p className="text-xs text-red-400">{importError}</p>
            )}
          </CardContent>
        </Card>

        {/* Perigo */}
        <Card className="bg-red-500/10 border-red-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Zona de Perigo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showDeleteConfirm ? (
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Apagar Todos os Dados
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-red-400 text-center">
                  Tem certeza? Esta ação não pode ser desfeita!
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleDeleteAll}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    Confirmar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botão Salvar */}
        <div className="mt-6">
          <Button
            onClick={handleSave}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg font-semibold"
          >
            Salvar Alterações
          </Button>
        </div>
      </div>
    </div>
  );
}

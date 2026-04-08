import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from 'next-themes';
import { ArrowLeft, User, Car, Fuel, Download, Upload, Trash2, AlertTriangle, Check, Plus, Smartphone, Bell, Moon, Sun } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { exportData, importData } from '@/lib/storage';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export function Settings() {
  const { user, saveUser, resetAllData, setCurrentView, togglePlataforma, addPlataforma } = useApp();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [nome, setNome] = useState(user?.nome || '');
  const [carro, setCarro] = useState(user?.carro || '');
  const [mediaGasolina, setMediaGasolina] = useState(user?.mediaGasolina?.toString() || '12');
  const [precoCombustivel, setPrecoCombustivel] = useState(user?.precoCombustivel?.toString() || '5.50');
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(false);

  // Estado para adicionar nova plataforma
  const [showAddApp, setShowAddApp] = useState(false);
  const [novoAppNome, setNovoAppNome] = useState('');
  const [novoAppIcone, setNovoAppIcone] = useState('🚗');

  const CORES_DISPONIVEIS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#14B8A6', '#EF4444', '#84CC16'];
  const ICONES_DISPONIVEIS = ['🚗', '🚕', '🚙', '🛵', '🏍️', '🚐', '📦', '🍔'];

  const handleSave = () => {
    if (!user) return;

    const updatedUser = {
      ...user,
      nome,
      carro,
      mediaGasolina: Number(mediaGasolina) || 12,
      precoCombustivel: Number(precoCombustivel) || 5.50,
    };

    saveUser(updatedUser);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleExport = async () => {
    try {
      const data = exportData();
      const fileName = `motorista-pro-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      try {
        const result = await Filesystem.writeFile({
          path: fileName,
          data: data,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
        
        if (result.uri) {
           await Share.share({
             title: 'Backup Motorista Pro',
             text: 'Aqui está o backup dos seus dados do Motorista Pro.',
             url: result.uri,
             dialogTitle: 'Salvar/Compartilhar Backup',
           });
           return;
        }
      } catch (err) {
        console.log('Fallback para exportação web', err);
      }

      // Web Fallback
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
       console.error("Erro ao exportar", error);
       alert("Erro ao exportar backup.");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importData(content);
        if (success) {
           window.location.reload(); 
        } else {
           alert("Arquivo de backup inválido ou corrompido.");
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleToggleNotificacoes = async () => {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      
      const newValue = !notificacoesAtivas;
      setNotificacoesAtivas(newValue);

      if (newValue) {
        // Solicita permissão se ativar
        const perm = await LocalNotifications.requestPermissions();
        if (perm.display === 'granted') {
          // Agenda lembrete todo dia as 20h
          await LocalNotifications.schedule({
            notifications: [
              {
                title: "Como foi o dia hoje?",
                body: "Não esqueça de registrar seus ganhos no Motorista Pro!",
                id: 1,
                schedule: { on: { hour: 20, minute: 0 } },
              }
            ]
          });
        } else {
          setNotificacoesAtivas(false); // Reverte se não deu permissão
          alert('Permissão para notificações negada.');
        }
      } else {
        // Cancela agendamento se desativar
        await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
      }
    } catch (e) {
      console.log('Notificações não suportadas neste ambiente (web).', e);
      setNotificacoesAtivas(!notificacoesAtivas);
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

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors">
        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Salvo!</h2>
          <p className="text-slate-500 dark:text-slate-400">Suas configurações foram atualizadas</p>
        </div>
      </div>
    );
  }

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
              className="text-slate-400"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">Configurações</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4">
        {/* Perfil */}
        <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 mb-4 shadow-sm text-slate-800 dark:text-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-600 dark:text-slate-300">Nome</Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <Car className="w-4 h-4" /> Carro
              </Label>
              <Input
                value={carro}
                onChange={(e) => setCarro(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <Fuel className="w-4 h-4" /> Preço do Combustível (R$/L)
              </Label>
              <Input
                type="number"
                step="0.01"
                value={precoCombustivel}
                onChange={(e) => setPrecoCombustivel(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white"
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
                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white"
              />
              <p className="text-xs text-slate-500">
                A média e o preço são usados para calcular o custo estimado de combustível em novos registros.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Meus Apps */}
        <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 mb-4 shadow-sm text-slate-800 dark:text-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              Meus Apps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {user?.plataformas?.map(p => (
              <button
                key={p.id}
                onClick={() => togglePlataforma(p.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200 ${p.ativo
                    ? 'border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/5'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 opacity-60'
                  }`}
              >
                <span className="text-lg">{p.icone}</span>
                <span className={`font-medium text-sm flex-1 text-left ${p.ativo ? 'text-slate-800 dark:text-white' : 'text-slate-500'}`}>
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
                <div className="flex gap-2">
                  {/* Seletor de ícone */}
                  <div className="flex flex-wrap gap-1">
                    {ICONES_DISPONIVEIS.map(ic => (
                      <button
                        key={ic}
                        onClick={() => setNovoAppIcone(ic)}
                        className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all ${novoAppIcone === ic ? 'bg-emerald-100 dark:bg-emerald-500/20 ring-1 ring-emerald-500' : 'bg-slate-100 dark:bg-slate-800'
                          }`}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
                <Input
                  value={novoAppNome}
                  onChange={(e) => setNovoAppNome(e.target.value)}
                  placeholder="Nome do app"
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddApp(false)}
                    className="flex-1 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
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
                className="w-full border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-500 mt-2 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar App
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Tema */}
        <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 mb-4 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-slate-800 dark:text-white flex items-center gap-2">
              {theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
              Aparência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-800 dark:text-white text-base">Modo Escuro</Label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Alternar tema do aplicativo</p>
              </div>
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${theme === 'dark' ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute transition-all ${theme === 'dark' ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 mb-4 shadow-sm text-slate-800 dark:text-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-800 dark:text-white text-base">Lembrete Diário</Label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Notificar todos os dias às 20h para registrar o turno</p>
              </div>
              <button 
                onClick={handleToggleNotificacoes}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${notificacoesAtivas ? 'bg-emerald-500' : 'bg-slate-600'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute transition-all ${notificacoesAtivas ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 mb-4 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-slate-800 dark:text-white">Dados</CardTitle>
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
            <Button
              variant="outline"
              onClick={handleImportClick}
              className="w-full border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Importar Backup
            </Button>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleImportFile}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* Perigo */}
        <Card className="bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Zona de Perigo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showDeleteConfirm ? (
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full border-red-300 dark:border-red-500/50 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Apagar Todos os Dados
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-red-600 dark:text-red-400 text-center">
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


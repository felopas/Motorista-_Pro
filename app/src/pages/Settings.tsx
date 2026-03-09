import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User, Car, Fuel, Download, Trash2, AlertTriangle, Check } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { exportData } from '@/lib/storage';

export function Settings() {
  const { user, saveUser, resetAllData, setCurrentView } = useApp();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [nome, setNome] = useState(user?.nome || '');
  const [carro, setCarro] = useState(user?.carro || '');
  const [mediaGasolina, setMediaGasolina] = useState(user?.mediaGasolina?.toString() || '12');

  const handleSave = () => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      nome,
      carro,
      mediaGasolina: Number(mediaGasolina) || 12,
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

  const handleDeleteAll = () => {
    resetAllData();
    setCurrentView('dashboard');
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Salvo!</h2>
          <p className="text-slate-400">Suas configurações foram atualizadas</p>
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
              <h1 className="text-xl font-bold text-white">Configurações</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4">
        {/* Perfil */}
        <Card className="bg-slate-800/50 border-slate-700 mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-400" />
              Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Nome</Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="bg-slate-900 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <Car className="w-4 h-4" /> Carro
              </Label>
              <Input
                value={carro}
                onChange={(e) => setCarro(e.target.value)}
                className="bg-slate-900 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <Fuel className="w-4 h-4" /> Média do Carro (km/l)
              </Label>
              <Input
                type="number"
                step="0.1"
                value={mediaGasolina}
                onChange={(e) => setMediaGasolina(e.target.value)}
                className="bg-slate-900 border-slate-600 text-white"
              />
              <p className="text-xs text-slate-500">
                Esta média é usada apenas para novos registros. Dados salvos não serão alterados.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <Card className="bg-slate-800/50 border-slate-700 mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white">Dados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              onClick={handleExport}
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar Backup
            </Button>
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
                    className="flex-1 border-slate-600 text-slate-300"
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

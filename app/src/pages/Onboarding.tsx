import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Car, User, Fuel, Check } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import type { UserProfile, AppPlataforma } from '@/types';
import { PLATAFORMAS_PADRAO } from '@/types';

export function Onboarding() {
  const { saveUser, setCurrentView, setSelectedDate } = useApp();
  const [nome, setNome] = useState('');
  const [carro, setCarro] = useState('');
  const [mediaGasolina, setMediaGasolina] = useState('');
  const [plataformas, setPlataformas] = useState<AppPlataforma[]>(
    PLATAFORMAS_PADRAO.map(p => ({ ...p }))
  );
  const [showSuccess, setShowSuccess] = useState(false);

  const togglePlataforma = (id: string) => {
    setPlataformas(prev =>
      prev.map(p => p.id === id ? { ...p, ativo: !p.ativo } : p)
    );
  };

  const handleFinish = () => {
    const user: UserProfile = {
      nome,
      carro,
      mediaGasolina: Number(mediaGasolina) || 12,
      custosFixos: [],
      totalCustosFixos: 0,
      plataformas,
    };
    saveUser(user);
    setShowSuccess(true);

    setTimeout(() => {
      setSelectedDate(new Date());
      setCurrentView('monthConfig');
    }, 1500);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Pronto!</h2>
          <p className="text-slate-400">Vamos começar a registrar seus ganhos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 pt-safe">
      <div className="max-w-md mx-auto pt-8">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-emerald-400" />
            </div>
            <CardTitle className="text-2xl text-white">Bem-vindo ao Motorista Pro</CardTitle>
            <CardDescription className="text-slate-400">
              Configure seu perfil para começar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-slate-300 flex items-center gap-2">
                <User className="w-4 h-4" /> Seu nome
              </Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: João Silva"
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carro" className="text-slate-300 flex items-center gap-2">
                <Car className="w-4 h-4" /> Seu carro
              </Label>
              <Input
                id="carro"
                value={carro}
                onChange={(e) => setCarro(e.target.value)}
                placeholder="Ex: Onix 2022"
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="media" className="text-slate-300 flex items-center gap-2">
                <Fuel className="w-4 h-4" /> Média do carro (km/l)
              </Label>
              <Input
                id="media"
                type="number"
                step="0.1"
                value={mediaGasolina}
                onChange={(e) => setMediaGasolina(e.target.value)}
                placeholder="Ex: 12"
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-500">
                Quantos quilômetros seu carro faz com 1 litro de gasolina
              </p>
            </div>

            {/* Seleção de Plataformas */}
            <div className="space-y-3">
              <Label className="text-slate-300">Quais apps você usa?</Label>
              <div className="grid grid-cols-2 gap-2">
                {plataformas.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlataforma(p.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all duration-200 ${p.ativo
                        ? 'border-emerald-500/60 bg-emerald-500/10 text-white'
                        : 'border-slate-700 bg-slate-800/30 text-slate-500'
                      }`}
                  >
                    <span className="text-lg">{p.icone}</span>
                    <span className="font-medium text-sm">{p.nome}</span>
                    {p.ativo && (
                      <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                Você pode alterar isso depois nas Configurações
              </p>
            </div>

            <Button
              onClick={handleFinish}
              disabled={!nome.trim() || !carro.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6"
            >
              Começar a Usar
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


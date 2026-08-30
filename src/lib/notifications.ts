import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { DailyRecord } from '@/types';

const REMINDER_HOUR = 20;
const REMINDER_MINUTE = 0;
const DIAS_A_FRENTE = 14;

function idParaData(dataStr: string): number {
  return Number(dataStr.replace(/-/g, ''));
}

function formatarData(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Fora do celular (navegador/PWA) não há LocalNotifications - todas as
// funções abaixo viram no-op sem quebrar o app.
function suportado(): boolean {
  return Capacitor.isNativePlatform();
}

export async function solicitarPermissaoNotificacao(): Promise<boolean> {
  if (!suportado()) return false;
  const status = await LocalNotifications.checkPermissions();
  if (status.display === 'granted') return true;
  const resultado = await LocalNotifications.requestPermissions();
  return resultado.display === 'granted';
}

// Reagenda, do zero, os lembretes dos próximos DIAS_A_FRENTE dias: pula dias
// que já têm um registro salvo (inclusive dias de folga) e horários que já
// passaram. Idempotente - seguro chamar sempre que records/preferência mudam.
export async function sincronizarLembretesDiarios(
  ativo: boolean,
  getRecordByDate: (data: string) => DailyRecord | undefined
): Promise<void> {
  if (!suportado()) return;

  const agora = new Date();
  const ids: number[] = [];
  const notificacoes: {
    id: number;
    title: string;
    body: string;
    schedule: { at: Date };
  }[] = [];

  for (let i = 0; i < DIAS_A_FRENTE; i++) {
    const data = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + i);
    const dataStr = formatarData(data);
    const id = idParaData(dataStr);
    ids.push(id);

    if (!ativo) continue;
    if (getRecordByDate(dataStr)) continue; // já registrado (ou folga)

    const disparo = new Date(data.getFullYear(), data.getMonth(), data.getDate(), REMINDER_HOUR, REMINDER_MINUTE);
    if (disparo.getTime() <= agora.getTime()) continue;

    notificacoes.push({
      id,
      title: 'Motorista Pro',
      body: 'Não esqueça de registrar o seu dia de hoje!',
      schedule: { at: disparo },
    });
  }

  try {
    await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) });
    if (notificacoes.length > 0) {
      await LocalNotifications.schedule({ notifications: notificacoes });
    }
  } catch {
    // Sem permissão ou plugin indisponível - ignora silenciosamente,
    // o lembrete é um extra, não algo que deve quebrar o app.
  }
}

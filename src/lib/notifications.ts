import { Capacitor } from '@capacitor/core';
import { LocalNotifications, type LocalNotificationSchema } from '@capacitor/local-notifications';
import type { DailyRecord } from '@/types';

const DIAS_A_FRENTE = 14;
export const HORARIO_PADRAO = '20:00';

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

// Reagenda, do zero, os lembretes dos próximos DIAS_A_FRENTE dias no horário
// escolhido (formato "HH:MM"): pula dias que já têm um registro salvo
// (inclusive dias de folga) e horários que já passaram. Idempotente - seguro
// chamar sempre que records/preferência/horário mudam.
export async function sincronizarLembretesDiarios(
  ativo: boolean,
  horario: string,
  getRecordByDate: (data: string) => DailyRecord | undefined
): Promise<void> {
  if (!suportado()) return;

  const [hora, minuto] = horario.split(':').map(Number);
  const agora = new Date();
  const ids: number[] = [];
  const notificacoes: LocalNotificationSchema[] = [];

  for (let i = 0; i < DIAS_A_FRENTE; i++) {
    const data = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + i);
    const dataStr = formatarData(data);
    const id = idParaData(dataStr);
    ids.push(id);

    if (!ativo) continue;
    if (getRecordByDate(dataStr)) continue; // já registrado (ou folga)

    const disparo = new Date(data.getFullYear(), data.getMonth(), data.getDate(), hora, minuto);
    if (disparo.getTime() <= agora.getTime()) continue;

    notificacoes.push({
      id,
      title: 'Motorista Pro',
      body: 'Não esqueça de registrar o seu dia de hoje!',
      schedule: { at: disparo },
      extra: { data: dataStr },
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

// Chama onTap(data) quando o usuário toca numa notificação de lembrete,
// com a data (YYYY-MM-DD) que a notificação representa - para levar direto
// à tela de registro daquele dia em vez de só abrir o app.
export function registrarListenerNotificacao(onTap: (data: string) => void): void {
  if (!suportado()) return;
  LocalNotifications.addListener('localNotificationActionPerformed', (evento) => {
    const data = evento.notification.extra?.data;
    if (typeof data === 'string') onTap(data);
  });
}

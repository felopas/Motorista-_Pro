// Helper para salvar e compartilhar arquivos gerados no app (PDF, backup JSON, etc).
//
// Tenta usar os plugins nativos do Capacitor (@capacitor/filesystem + @capacitor/share)
// para salvar o arquivo em Directory.Documents e abrir a folha de compartilhamento nativa.
// Em ambiente web (PWA/browser), essas chamadas nativas falham (são no-ops que lançam
// erro), então o catch cai automaticamente para o fallback já usado hoje: um Blob +
// link <a download>.

import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export interface NativeExportOptions {
  /** Nome do arquivo a ser salvo, incluindo extensão (ex: "relatorio.pdf"). */
  fileName: string;
  /** Conteúdo do arquivo: uma string base64 (quando isBase64 = true) ou texto UTF-8. */
  base64OrText: string;
  /** true para conteúdo binário em base64 (ex: PDF); false para texto puro (ex: JSON). */
  isBase64: boolean;
  /** MIME type usado no fallback web (ex: "application/pdf", "application/json"). */
  mimeType: string;
  /** Título usado na folha de compartilhamento nativa. */
  shareTitle: string;
  /** Texto/descrição usado na folha de compartilhamento nativa. */
  shareText: string;
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

function downloadViaBlob(fileName: string, base64OrText: string, isBase64: boolean, mimeType: string): void {
  const blob = isBase64
    ? base64ToBlob(base64OrText, mimeType)
    : new Blob([base64OrText], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Salva um arquivo via Capacitor Filesystem (Directory.Documents) e abre o
 * compartilhamento nativo via Capacitor Share. Se qualquer etapa nativa falhar
 * (por exemplo, rodando no navegador/PWA), cai para download via Blob + <a download>.
 */
export async function exportAndShareFile({
  fileName,
  base64OrText,
  isBase64,
  mimeType,
  shareTitle,
  shareText,
}: NativeExportOptions): Promise<void> {
  try {
    const result = await Filesystem.writeFile({
      path: fileName,
      data: base64OrText,
      directory: Directory.Documents,
      ...(isBase64 ? {} : { encoding: Encoding.UTF8 }),
    });

    if (!result.uri) {
      throw new Error('Filesystem.writeFile não retornou uri');
    }

    await Share.share({
      title: shareTitle,
      text: shareText,
      url: result.uri,
      dialogTitle: shareTitle,
    });
    return;
  } catch {
    // Fallback: navegador/PWA ou plugin nativo indisponível.
    downloadViaBlob(fileName, base64OrText, isBase64, mimeType);
  }
}

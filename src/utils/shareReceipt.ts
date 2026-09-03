/**
 * Hands a receipt PNG off to another app via the OS share sheet — the
 * practical workaround for platforms where Web Bluetooth is unavailable
 * (most notably iOS, where no browser supports it at all). The user picks
 * the printer manufacturer's own app (e.g. AiYin) from the native share
 * sheet, which already knows how to talk to the printer reliably.
 */
export function isWebShareFileSupported(): boolean {
  if (typeof navigator === 'undefined' || !navigator.share || !navigator.canShare) {
    return false;
  }
  try {
    const probeFile = new File([''], 'probe.png', { type: 'image/png' });
    return navigator.canShare({ files: [probeFile] });
  } catch {
    return false;
  }
}

export async function shareReceiptImage(pngBlob: Blob, filename: string): Promise<'shared' | 'cancelled'> {
  const file = new File([pngBlob], filename, { type: 'image/png' });

  if (!isWebShareFileSupported()) {
    throw new Error(
      "Bu brauzer rasm ulashishni qo'llab-quvvatlamaydi. Rasmni saqlab, uni qo'lda printer ilovasida oching."
    );
  }

  try {
    await navigator.share({
      files: [file],
      title: 'Dental Chek',
      text: 'Chekni printer ilovasida oching va chop eting'
    });
    return 'shared';
  } catch (err: any) {
    // User cancelling the native share sheet throws AbortError — not a real failure.
    if (err?.name === 'AbortError') {
      return 'cancelled';
    }
    throw err;
  }
}

/**
 * Fallback for browsers without Web Share file support: opens the PNG in a
 * new tab so the user can long-press / right-click to save it, then import
 * it manually into the printer app.
 */
export function openReceiptImageInNewTab(pngBlob: Blob): void {
  const url = URL.createObjectURL(pngBlob);
  window.open(url, '_blank');
  // Revoke after a delay long enough for the new tab to load the image.
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Sends a receipt file (PNG image or PDF document) to a Telegram chat via
 * the app's own serverless proxy (`/api/send-telegram`), which holds the bot
 * token server-side. Avoids filling the phone's Camera Roll: the receipt
 * lives in the Telegram chat instead of Photos, and can be forwarded from
 * there as needed.
 */
export async function sendReceiptFileToTelegram(
  fileBlob: Blob,
  fileName: string,
  caption: string,
  fileType: 'photo' | 'document' = 'photo'
): Promise<void> {
  const fileBase64 = await blobToBase64(fileBlob);

  const res = await fetch('/api/send-telegram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileBase64, caption, fileType, fileName })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Telegramga yuborishda xatolik yuz berdi.");
  }
}

// Service UUIDs for popular 58mm ESC/POS Bluetooth printers
export const POS_PRINTER_SERVICE_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  '00001101-0000-1000-8000-00805f9b34fb'
];

export const POS_PRINTER_CHARACTERISTIC_UUIDS = [
  '00002af1-0000-1000-8000-00805f9b34fb',
  'e7810a72-73ae-499d-8c15-faa9aef0c3f2',
  '0000ff02-0000-1000-8000-00805f9b34fb',
  '49535343-1e4d-4bd9-ba61-23c647249616',
  '00001101-0000-1000-8000-00805f9b34fb'
];

const CHARACTERISTIC_PROPERTY_NAMES = [
  'broadcast',
  'read',
  'writeWithoutResponse',
  'write',
  'notify',
  'indicate',
  'authenticatedSignedWrites',
  'reliableWrite',
  'writableAuxiliaries'
];

function listCharacteristicProperties(props: any): string[] {
  return CHARACTERISTIC_PROPERTY_NAMES.filter((name) => !!props?.[name]);
}

export interface WritableCandidate {
  serviceUuid: string;
  characteristic: any; // BluetoothRemoteGATTCharacteristic
  useResponseWrite: boolean;
  notifyCharacteristics: any[]; // sibling notify/indicate characteristics in the SAME service
}

export interface BluetoothConnection {
  device: any; // BluetoothDevice
  gattServer: any; // BluetoothRemoteGATTServer
  characteristic: any; // BluetoothRemoteGATTCharacteristic — best-guess print channel
  writableCandidates: WritableCandidate[]; // every writable characteristic found, for diagnostics
}

let activeConnection: BluetoothConnection | null = null;

/**
 * Checks if Web Bluetooth API is supported in the current browser environment.
 */
export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

/**
 * Walks every service/characteristic exposed by the device, logs the REAL
 * properties (write / writeWithoutResponse / notify / ...) of each, and
 * returns every writable characteristic paired with any notify/indicate
 * characteristics found in the SAME service. Note: Web Bluetooth only
 * exposes services listed in `optionalServices` at requestDevice() time —
 * a printer using a vendor-specific service UUID outside our known list
 * will simply not appear here at all.
 */
async function discoverWritableCharacteristics(gattServer: any): Promise<WritableCandidate[]> {
  const candidates: WritableCandidate[] = [];
  try {
    const services = await gattServer.getPrimaryServices();
    console.log(`[Bluetooth] Qurilmada ${services.length} ta GATT xizmat (service) topildi:`);
    for (const service of services) {
      const characteristics = await service.getCharacteristics();
      console.log(`  Service: ${service.uuid}`);

      const notifyChars: any[] = [];
      const writableChars: { char: any; useResponseWrite: boolean }[] = [];

      for (const char of characteristics) {
        const propList = listCharacteristicProperties(char.properties);
        console.log(`    Characteristic: ${char.uuid} — [${propList.join(', ') || 'hech qanday xususiyat'}]`);

        if (char.properties?.notify || char.properties?.indicate) {
          notifyChars.push(char);
        }
        if (char.properties?.write || char.properties?.writeWithoutResponse) {
          writableChars.push({ char, useResponseWrite: !!char.properties.write });
        }
      }

      for (const w of writableChars) {
        candidates.push({
          serviceUuid: service.uuid,
          characteristic: w.char,
          useResponseWrite: w.useResponseWrite,
          notifyCharacteristics: notifyChars
        });
      }
    }
  } catch (e) {
    console.warn("[Bluetooth] GATT xaritasini o'qishda xatolik:", e);
  }
  return candidates;
}

/**
 * Subscribes to a set of notify/indicate characteristics and logs anything
 * the device sends back. Many cheap "transparent UART" BLE bridge modules
 * (HM-10/HC-08 clones and similar) only forward writes through to the real
 * serial/printer engine AFTER a central has subscribed to the paired notify
 * characteristic — without this handshake, writes are ACKed at the GATT
 * layer but silently dropped internally. This is the #1 remaining cause of
 * "writes succeed, printer does nothing" once chunk size & channel are correct.
 */
async function subscribeToNotifications(notifyChars: any[]): Promise<void> {
  for (const nc of notifyChars) {
    try {
      await nc.startNotifications();
      nc.addEventListener('characteristicvaluechanged', (event: any) => {
        const value: DataView = event.target.value;
        const bytes = Array.from(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
        console.log(`[Bluetooth] <- Notify javobi (${nc.uuid}):`, bytes);
      });
      console.log(`[Bluetooth] Notify obuna bo'ldi: ${nc.uuid}`);
    } catch (e) {
      console.warn(`[Bluetooth] Notify obuna bo'lishda xatolik (${nc.uuid}):`, e);
    }
  }
  if (notifyChars.length > 0) {
    // Give the module a moment to open its internal serial bridge after subscription
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

/**
 * Writes a byte buffer to a specific characteristic in chunks.
 *
 * Once a device/channel is confirmed working, most desktop Bluetooth stacks
 * (Windows/Chrome included) actually negotiate an extended ATT_MTU (usually
 * 185-247 bytes) well above the unnegotiated 23-byte default — Chrome just
 * doesn't expose the negotiated value, so we can't ask for it directly. The
 * 20-byte/20ms defaults below exist for the FIRST, unverified write to a new
 * channel (see `testAllWritableChannels`), where staying under the worst-case
 * default MTU matters more than speed. For the real, already-confirmed print
 * path, larger chunks and a shorter delay cut print time dramatically with
 * no observed data loss on this printer.
 */
async function writeInChunks(
  characteristic: any,
  data: Uint8Array,
  useResponseWrite: boolean,
  chunkSize: number = 20,
  delayMs: number = 20
): Promise<void> {
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    if (useResponseWrite) {
      await characteristic.writeValue(chunk);
    } else {
      await characteristic.writeValueWithoutResponse(chunk);
    }
    // Small delay between chunks to let the printer's BLE buffer drain
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

/**
 * Requests and connects to a Bluetooth 58mm Thermal Printer.
 */
export async function connectBluetoothPrinter(): Promise<BluetoothConnection> {
  if (!isWebBluetoothSupported()) {
    throw new Error(
      "Brauzeringiz Web Bluetooth API-ni qo'llab-quvvatlamaydi. Web Bluetooth Google Chrome yoki MS Edge brauzerlarida ishlaydi."
    );
  }

  try {
    // Request device with optional POS printer services
    const device = await (navigator as any).bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: POS_PRINTER_SERVICE_UUIDS
    });

    if (!device) {
      throw new Error("Printer qurilmasi tanlanmadi.");
    }

    console.log(`[Bluetooth] Qurilmaga ulaninmoqda: ${device.name || 'Noma\'lum printer'}`);

    const gattServer = await device.gatt.connect();

    // Let the connection settle before service discovery — some cheap BLE-UART
    // printer modules reject/ignore immediate GATT operations right after connect.
    await new Promise((resolve) => setTimeout(resolve, 300));

    const writableCandidates = await discoverWritableCharacteristics(gattServer);

    if (writableCandidates.length === 0) {
      throw new Error(
        "Printerda yoziladigan kanal (write characteristic) topilmadi. Printeringiz Bluetooth Classic (SPP) protokolida bo'lishi mumkin — Web Bluetooth faqat BLE (GATT) qurilmalarni qo'llab-quvvatlaydi."
      );
    }

    // Best-guess primary channel: prefer a characteristic matching our known
    // print-data UUID list (in service order), otherwise fall back to the
    // first writable candidate found. If this guess is wrong, use
    // testAllWritableChannels() to brute-force every candidate.
    const primaryCandidate =
      writableCandidates.find((c) => POS_PRINTER_CHARACTERISTIC_UUIDS.includes(c.characteristic.uuid)) ||
      writableCandidates[0];

    console.log(`[Bluetooth] Asosiy kanal sifatida tanlandi: ${primaryCandidate.characteristic.uuid}`);

    // Handshake: subscribe to any notify/indicate characteristic living in the
    // same service as the chosen write channel before sending real data.
    await subscribeToNotifications(primaryCandidate.notifyCharacteristics);

    activeConnection = {
      device,
      gattServer,
      characteristic: primaryCandidate.characteristic,
      writableCandidates
    };

    // Handle unexpected disconnection
    device.addEventListener('gattserverdisconnected', () => {
      console.warn('[Bluetooth] Printer uzildi');
      activeConnection = null;
    });

    return activeConnection;
  } catch (error: any) {
    console.error('[Bluetooth] Ulanish xatosi:', error);
    throw new Error(error.message || "Bluetooth printerga ulanib bo'lmadi.");
  }
}

/**
 * Sends a 1bpp raster bitmap to the printer using the AiYin/D11s-family
 * command protocol (reverse-engineered from the same GATT layout our device
 * exposes: service 0000ff00, write ff02, notify ff01/ff03). These printers
 * do NOT interpret plain ESC/POS text — they only render raw bitmap data
 * wrapped in this specific init/raster/completion command sequence.
 */
export async function printBitmapAiyin(
  bitmap: { widthBytes: number; heightPx: number; data: Uint8Array },
  options?: { density?: number; continuousPaper?: boolean }
): Promise<void> {
  if (!activeConnection || !activeConnection.gattServer.connected) {
    throw new Error("Bluetooth printerga ulanmagan. Avval printerni ulang.");
  }

  const { characteristic } = activeConnection;
  const useResponseWrite = !!characteristic.properties.write;

  const density = options?.density ?? 2;
  // Receipt-roll printers have no label gap sensor, so continuous mode (0x01)
  // is the safer default vs. the D11s label printer's documented 0x00 (gap).
  const paperTypeByte = options?.continuousPaper === false ? 0x00 : 0x01;

  // Blank feed before and after the printed content, so there's enough bare
  // paper to grab and tear off by hand. ~0.125mm/dot at 203 DPI, so 56 dots
  // ≈ 7mm top and bottom.
  const topFeedDots = 56;
  const bottomFeedDots = 56;

  const header: number[] = [
    0x10, 0xff, 0x10, 0x00, density, // set density
    0x10, 0xff, 0x84, paperTypeByte, // set paper type
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // 12-byte wake-up
    0x10, 0xff, 0xfe, 0x01, // enable printer (AiYin-specific)
    0x1b, 0x4a, topFeedDots, // ESC J n — blank feed before printing (top margin)
    0x1d, 0x76, 0x30, 0x00, // raster command: GS v0, normal mode
    bitmap.widthBytes & 0xff,
    (bitmap.widthBytes >> 8) & 0xff,
    bitmap.heightPx & 0xff,
    (bitmap.heightPx >> 8) & 0xff
  ];

  // Tear-off feed: use a small, explicit dot-count feed (ESC J n — "print and
  // feed n dots") instead of the documented "form feed" (0x1D 0x0C), which on
  // label printers advances to the NEXT LABEL boundary. On continuous
  // receipt-roll paper with no gap sensor, that command has no boundary to
  // find and can feed a large, unpredictable amount of blank paper — exactly
  // the "too much space after the receipt" symptom.
  const footer: number[] = [
    0x1b, 0x4a, bottomFeedDots, // ESC J n — blank feed after printing (bottom margin)
    0x10, 0xff, 0xfe, 0x45 // stop print (AiYin-specific)
  ];

  const payload = new Uint8Array(header.length + bitmap.data.length + footer.length);
  payload.set(header, 0);
  payload.set(bitmap.data, header.length);
  payload.set(footer, header.length + bitmap.data.length);

  console.log(
    `[Bluetooth] AiYin bitmap chop etilmoqda: ${bitmap.widthBytes * 8}x${bitmap.heightPx}px, jami ${payload.length} bayt → ${characteristic.uuid}`
  );

  try {
    // Larger chunks + shorter delay than the conservative diagnostic default —
    // this channel is already confirmed working, so we can push more per
    // write. Cuts total print time roughly 5-10x with no observed data loss.
    await writeInChunks(characteristic, payload, useResponseWrite, 150, 4);
  } catch (err: any) {
    console.error('[Bluetooth] Bitmap yozish xatosi:', err);
    throw new Error(`Printerga rasm yuborishda xatolik: ${err.message || err}`);
  }

  console.log('[Bluetooth] AiYin bitmap yuborildi.');
}

/**
 * Sends binary ESC/POS data to connected Bluetooth printer's best-guess channel.
 */
export async function sendEscPosToPrinter(data: Uint8Array): Promise<void> {
  if (!activeConnection || !activeConnection.gattServer.connected) {
    throw new Error("Bluetooth printerga ulanmagan. Avval printerni ulang.");
  }

  const { characteristic } = activeConnection;
  const useResponseWrite = !!characteristic.properties.write;

  console.log(
    `[Bluetooth] ${data.length} bayt yuborilmoqda → ${characteristic.uuid} (${
      useResponseWrite ? 'write-with-response' : 'write-without-response'
    } rejimida)...`
  );

  try {
    await writeInChunks(characteristic, data, useResponseWrite);
  } catch (err: any) {
    console.error('[Bluetooth] Yozish xatosi:', err);
    throw new Error(`Printerga ma'lumot yuborishda xatolik: ${err.message || err}`);
  }

  console.log('[Bluetooth] Barcha ma\'lumotlar yuborildi.');
}

/**
 * Diagnostic tool: sends a short, labeled test print to EVERY writable
 * characteristic found on the connected device, one at a time with a pause
 * in between (subscribing to that channel's notify siblings first, as a
 * handshake, before each write). Use this when the "best guess" channel
 * doesn't physically print anything — watch the printer and note which
 * attempt number (shown via onProgress) actually produces paper movement.
 */
export async function testAllWritableChannels(
  onProgress?: (info: { index: number; total: number; serviceUuid: string; charUuid: string; mode: string }) => void
): Promise<void> {
  if (!activeConnection) {
    throw new Error("Bluetooth printerga ulanmagan. Avval printerni ulang.");
  }

  const { writableCandidates } = activeConnection;
  if (writableCandidates.length === 0) {
    throw new Error('Yoziladigan kanal topilmadi.');
  }

  for (let i = 0; i < writableCandidates.length; i++) {
    const candidate = writableCandidates[i];
    const shortUuid = candidate.characteristic.uuid.split('-')[0];
    const mode = candidate.useResponseWrite ? 'write' : 'writeWithoutResponse';

    onProgress?.({
      index: i + 1,
      total: writableCandidates.length,
      serviceUuid: candidate.serviceUuid,
      charUuid: candidate.characteristic.uuid,
      mode
    });
    console.log(`[Bluetooth] (${i + 1}/${writableCandidates.length}) Sinalmoqda: ${candidate.characteristic.uuid} (${mode})`);

    try {
      await subscribeToNotifications(candidate.notifyCharacteristics);
      const testBytes = buildChannelTestBytes(`KANAL ${i + 1}: ${shortUuid}`);
      await writeInChunks(candidate.characteristic, testBytes, candidate.useResponseWrite);
      console.log(`[Bluetooth]   -> yuborildi, printerni kuzating...`);
    } catch (err) {
      console.warn(`[Bluetooth]   -> yozib bo'lmadi:`, err);
    }

    // Pause so the user has time to visually/audibly notice a reaction
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
}

function buildChannelTestBytes(label: string): Uint8Array {
  const bytes: number[] = [];
  const addBytes = (...arr: number[]) => bytes.push(...arr);
  const addLine = (str: string) => {
    for (let i = 0; i < str.length; i++) {
      bytes.push(str.charCodeAt(i) & 0xff);
    }
    bytes.push(0x0a);
  };

  addBytes(0x1b, 0x40); // init
  addBytes(0x1b, 0x61, 0x01); // center
  addBytes(0x1b, 0x45, 0x01); // bold on
  addLine('--------------------------------');
  addLine(label);
  addLine('--------------------------------');
  addBytes(0x1b, 0x45, 0x00); // bold off
  addBytes(0x0a, 0x0a);

  return new Uint8Array(bytes);
}

/**
 * Gets active printer device name if connected.
 */
export function getActivePrinterName(): string | null {
  if (activeConnection && activeConnection.gattServer.connected) {
    return activeConnection.device.name || 'Bluetooth Printer';
  }
  return null;
}

/**
 * Disconnects active Bluetooth printer.
 */
export function disconnectBluetoothPrinter(): void {
  if (activeConnection && activeConnection.gattServer) {
    try {
      activeConnection.gattServer.disconnect();
    } catch (e) {
      console.error('[Bluetooth] Uzishda xatolik:', e);
    }
    activeConnection = null;
  }
}

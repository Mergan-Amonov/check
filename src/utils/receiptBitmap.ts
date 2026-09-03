/**
 * Renders formatted receipt text into a raster image, for two different
 * consumers:
 *
 * 1. Direct Bluetooth printing (Android Chrome/Edge): some cheap 58mm
 *    "thermal pocket printers" (e.g. AiYin B-series, D11s and similar OEM
 *    clones sharing the same firmware family) do NOT implement a text/ESC-POS
 *    command interpreter at all — they only accept raw 1bpp raster image
 *    data. See `renderTextToBitmap`.
 * 2. Handing the receipt off to the printer manufacturer's own mobile app as
 *    a PNG (needed on iOS, where Web Bluetooth is not supported by any
 *    browser — it's a platform-level restriction, not something fixable in
 *    web code). See `renderTextToPngBlob`.
 */
export interface PrinterBitmap {
  widthPx: number;
  widthBytes: number;
  heightPx: number;
  data: Uint8Array; // 1bpp, MSB-first, row-major, widthBytes per row
}

/**
 * Draws the receipt text onto an offscreen canvas at the given pixel width,
 * auto-sizing a monospace font so the longest line fits. Shared by both the
 * 1bpp bitmap path (direct BLE printing) and the PNG export path (share to
 * the printer's own app).
 */
function renderReceiptCanvas(text: string, widthPx: number): HTMLCanvasElement {
  const lines = text.split('\n');
  const marginX = 3;
  const usableWidth = widthPx - marginX * 2;

  // Pick the largest monospace font size whose longest line still fits.
  const measureCanvas = document.createElement('canvas');
  const measureCtx = measureCanvas.getContext('2d')!;
  let fontSize = 32;
  const longestLine = lines.reduce((a, b) => (b.length > a.length ? b : a), '');

  while (fontSize > 8) {
    measureCtx.font = `${fontSize}px "Courier New", monospace`;
    const width = measureCtx.measureText(longestLine || 'M').width;
    if (width <= usableWidth) break;
    fontSize -= 0.5;
  }

  const lineHeight = Math.ceil(fontSize * 1.25);
  const marginY = 6;
  const heightPx = lineHeight * lines.length + marginY * 2;

  const canvas = document.createElement('canvas');
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext('2d')!;

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, widthPx, heightPx);

  // Black monospace text
  ctx.fillStyle = '#000000';
  ctx.font = `${fontSize}px "Courier New", monospace`;
  ctx.textBaseline = 'top';
  lines.forEach((line, i) => {
    ctx.fillText(line, marginX, marginY + i * lineHeight);
  });

  return canvas;
}

/**
 * Renders a block of monospace text (already formatted to N columns) into a
 * 1bpp bitmap sized for a thermal print head of the given pixel width
 * (384px is the standard head width for 58mm printers at ~203 DPI).
 */
export function renderTextToBitmap(text: string, widthPx: number = 384): PrinterBitmap {
  const canvas = renderReceiptCanvas(text, widthPx);
  const heightPx = canvas.height;
  const ctx = canvas.getContext('2d')!;

  const imageData = ctx.getImageData(0, 0, widthPx, heightPx);
  const widthBytes = Math.ceil(widthPx / 8);
  const data = new Uint8Array(widthBytes * heightPx);

  for (let y = 0; y < heightPx; y++) {
    for (let x = 0; x < widthPx; x++) {
      const pixelIndex = (y * widthPx + x) * 4;
      const r = imageData.data[pixelIndex];
      const g = imageData.data[pixelIndex + 1];
      const b = imageData.data[pixelIndex + 2];
      const luminance = (r + g + b) / 3;
      const isBlack = luminance < 128;
      if (isBlack) {
        const byteIndex = y * widthBytes + (x >> 3);
        const bitMask = 0x80 >> (x & 7);
        data[byteIndex] |= bitMask;
      }
    }
  }

  return { widthPx, widthBytes, heightPx, data };
}

/**
 * Renders the receipt onto an upscaled canvas for legibility when viewed
 * through a third-party app or embedded in a PDF (nearest-neighbor scaling
 * keeps the monospace text crisp instead of blurry).
 */
export function renderReceiptCanvasScaled(text: string, widthPx: number = 384, scale: number = 2): HTMLCanvasElement {
  const baseCanvas = renderReceiptCanvas(text, widthPx);

  const outCanvas = document.createElement('canvas');
  outCanvas.width = baseCanvas.width * scale;
  outCanvas.height = baseCanvas.height * scale;
  const outCtx = outCanvas.getContext('2d')!;
  outCtx.imageSmoothingEnabled = false;
  outCtx.drawImage(baseCanvas, 0, 0, outCanvas.width, outCanvas.height);

  return outCanvas;
}

/**
 * Renders the receipt text into a PNG image blob, upscaled for legibility
 * when viewed/printed through a third-party app (e.g. the printer
 * manufacturer's own mobile app via the OS share sheet on iOS).
 */
export function renderTextToPngBlob(text: string, widthPx: number = 384, scale: number = 2): Promise<Blob> {
  const outCanvas = renderReceiptCanvasScaled(text, widthPx, scale);

  return new Promise((resolve, reject) => {
    outCanvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('PNG yaratib bo\'lmadi.'));
    }, 'image/png');
  });
}

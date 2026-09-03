import { Receipt, ClinicSettings } from '../types';

/**
 * Center aligns text within a line of fixed width (default 32 chars).
 */
export function centerText(text: string, width: number = 32): string {
  const trimmed = text.trim();
  if (trimmed.length >= width) {
    return trimmed.slice(0, width);
  }
  const totalPadding = width - trimmed.length;
  const padLeft = Math.floor(totalPadding / 2);
  const padRight = totalPadding - padLeft;
  return ' '.repeat(padLeft) + trimmed + ' '.repeat(padRight);
}

/**
 * Formats left string and right string into lines of max 32 characters.
 * Left string (e.g. treatment name) and right string (e.g. price) are spaced out.
 * If left text is too long, it wraps cleanly to the next line.
 */
export function formatTwoColumns(
  left: string,
  right: string,
  width: number = 32,
  fillChar: string = ' '
): string[] {
  const rightStr = right.trim();
  const leftStr = left.trim();

  // If no right string, pad or wrap left string
  if (!rightStr) {
    return wrapText(leftStr, width);
  }

  // Minimum 1 space between left and right
  const availForLeft = width - rightStr.length - 1;

  if (availForLeft <= 0) {
    // Right string itself is very long, output left on line 1, right on line 2
    return [...wrapText(leftStr, width), padLeftRight('', rightStr, width)];
  }

  if (leftStr.length <= availForLeft) {
    // Fits in one line
    const fillCount = width - leftStr.length - rightStr.length;
    const padding = fillCount > 0 ? fillChar.repeat(fillCount) : ' ';
    return [`${leftStr}${padding}${rightStr}`];
  }

  // Left string is longer than available space, wrap left string
  const lines: string[] = [];
  let remaining = leftStr;

  // First line gets the first chunk of left + right
  const firstChunk = remaining.slice(0, availForLeft);
  remaining = remaining.slice(availForLeft).trim();

  const fillCount = width - firstChunk.length - rightStr.length;
  const padding = fillCount > 0 ? fillChar.repeat(fillCount) : ' ';
  lines.push(`${firstChunk}${padding}${rightStr}`);

  // Subsequent lines get remaining left text
  while (remaining.length > 0) {
    const chunk = remaining.slice(0, width);
    remaining = remaining.slice(width).trim();
    lines.push(chunk);
  }

  return lines;
}

function padLeftRight(left: string, right: string, width: number = 32): string {
  const fillCount = width - left.length - right.length;
  const padding = fillCount > 0 ? ' '.repeat(fillCount) : ' ';
  return `${left}${padding}${right}`;
}

function wrapText(text: string, width: number = 32): string[] {
  const lines: string[] = [];
  let remaining = text.trim();
  while (remaining.length > 0) {
    lines.push(remaining.slice(0, width));
    remaining = remaining.slice(width).trim();
  }
  return lines.length > 0 ? lines : [''];
}

/**
 * Formats currency number into standard Uzbek format: e.g., 200000 -> "200,000" or "200 000"
 */
export function formatPrice(amount: number): string {
  return amount.toLocaleString('en-US'); // e.g. 200,000
}

/**
 * Generates exact 32-character formatted text receipt representation.
 * Exactly matches the specified prompt layout.
 */
export function generateReceiptText(receipt: Receipt, settings?: ClinicSettings): string {
  const width = settings?.columnWidth || 32;
  const doubleDivider = '='.repeat(width);
  const singleDivider = '-'.repeat(width);

  const lines: string[] = [];

  // Header
  lines.push(doubleDivider);
  lines.push(centerText(receipt.clinicName || 'DENTAL CLINIC', width));
  const subHeader = `${receipt.doctorName || 'Dr. Akramov'} | ${receipt.clinicPhone || '+998 90 123 45 67'}`;
  lines.push(centerText(subHeader, width));
  lines.push(doubleDivider);

  // Metadata (Date, Time, Patient)
  const dateLabel = `Sana: ${receipt.dateStr}`;
  const timeLabel = receipt.timeStr;
  lines.push(padLeftRight(dateLabel, timeLabel, width));

  if (receipt.patientName) {
    lines.push(padLeftRight(`Mijoz: ${receipt.patientName}`, '', width));
  }

  lines.push(singleDivider);

  // Items Header
  lines.push(padLeftRight('Muolaja', 'Narxi', width));
  lines.push(singleDivider);

  // Items List
  receipt.items.forEach((item) => {
    const qtySuffix = item.quantity > 1 ? ` (${item.quantity}x)` : '';
    const nameWithQty = `${item.name}${qtySuffix}`;
    const priceFormatted = formatPrice(item.total);
    const itemLines = formatTwoColumns(nameWithQty, priceFormatted, width);
    lines.push(...itemLines);
  });

  lines.push(singleDivider);

  // Total
  const totalFormatted = formatPrice(receipt.totalAmount);
  lines.push(padLeftRight('JAMI:', totalFormatted, width));
  lines.push(doubleDivider);

  // Footer
  const footerMsg = settings?.footerMessage || 'Salomat bo\'ling! :)';
  lines.push(centerText(footerMsg, width));
  lines.push(doubleDivider);

  return lines.join('\n');
}

/**
 * ESC/POS Binary Generator for 58mm Thermal Printers
 * Standard ESC/POS Command Constants:
 * ESC @ : Initialize printer [0x1B, 0x40]
 * ESC a n : Align (0: Left, 1: Center, 2: Right) [0x1B, 0x61, n]
 * ESC E n : Bold mode (1: ON, 0: OFF) [0x1B, 0x45, n]
 * LF : Line Feed [0x0A]
 */
export function generateEscPosBytes(receipt: Receipt, settings?: ClinicSettings): Uint8Array {
  const width = settings?.columnWidth || 32;
  const bytes: number[] = [];

  const addBytes = (...arr: number[]) => bytes.push(...arr);
  const addString = (str: string) => {
    // Sanitize string to standard Latin ASCII bytes
    const sanitized = sanitizeAscii(str);
    for (let i = 0; i < sanitized.length; i++) {
      bytes.push(sanitized.charCodeAt(i));
    }
  };
  const addLine = (str: string) => {
    addString(str);
    addBytes(0x0A); // Line feed
  };

  // 1. Initialize printer
  addBytes(0x1B, 0x40);

  // 2. Header (Centered & Bold)
  addBytes(0x1B, 0x61, 0x01); // Center align
  addBytes(0x1B, 0x45, 0x01); // Bold ON
  addLine('='.repeat(width));
  addLine(centerText(receipt.clinicName || 'DENTAL CLINIC', width));
  addBytes(0x1B, 0x45, 0x00); // Bold OFF
  addLine(centerText(`${receipt.doctorName || 'Dr. Akramov'} | ${receipt.clinicPhone || '+998 90 123 45 67'}`, width));
  addLine('='.repeat(width));

  // 3. Date, Time & Patient (Left Aligned)
  addBytes(0x1B, 0x61, 0x00); // Left align
  const dateLabel = `Sana: ${receipt.dateStr}`;
  const timeLabel = receipt.timeStr;
  addLine(padLeftRight(dateLabel, timeLabel, width));
  if (receipt.patientName) {
    addLine(`Mijoz: ${receipt.patientName}`);
  }
  addLine('-'.repeat(width));

  // 4. Items Table Header (Bold)
  addBytes(0x1B, 0x45, 0x01); // Bold ON
  addLine(padLeftRight('Muolaja', 'Narxi', width));
  addBytes(0x1B, 0x45, 0x00); // Bold OFF
  addLine('-'.repeat(width));

  // 5. Items List
  receipt.items.forEach((item) => {
    const qtySuffix = item.quantity > 1 ? ` (${item.quantity}x)` : '';
    const nameWithQty = `${item.name}${qtySuffix}`;
    const priceFormatted = formatPrice(item.total);
    const itemLines = formatTwoColumns(nameWithQty, priceFormatted, width);
    itemLines.forEach((l) => addLine(l));
  });

  addLine('-'.repeat(width));

  // 6. Total (Bold)
  addBytes(0x1B, 0x45, 0x01); // Bold ON
  const totalFormatted = formatPrice(receipt.totalAmount);
  addLine(padLeftRight('JAMI:', totalFormatted, width));
  addBytes(0x1B, 0x45, 0x00); // Bold OFF
  addLine('='.repeat(width));

  // 7. Footer (Centered)
  addBytes(0x1B, 0x61, 0x01); // Center align
  const footerMsg = settings?.footerMessage || 'Salomat bo\'ling! :)';
  addLine(centerText(footerMsg, width));
  addLine('='.repeat(width));

  // 8. Feed 3 lines & reset alignment
  addBytes(0x0A, 0x0A, 0x0A);
  addBytes(0x1B, 0x61, 0x00);

  // 9. Cut paper (GS V 66 0) if supported, ignored by basic printers
  addBytes(0x1D, 0x56, 0x42, 0x00);

  return new Uint8Array(bytes);
}

/**
 * Normalizes Uzbek characters and punctuation to clean single-byte ASCII
 * for maximum compatibility with thermal printer ROM fonts.
 */
function sanitizeAscii(str: string): string {
  return str
    .replace(/[‘'’`']/g, "'")
    .replace(/ʻ|ʼ/g, "'")
    .replace(/–|—/g, "-")
    .replace(/“|”|"/g, '"');
}

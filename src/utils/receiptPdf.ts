import { renderReceiptCanvasScaled } from './receiptBitmap';

/**
 * Renders the receipt text into a PDF sized to a narrow 58mm-style page,
 * reusing the same canvas rendering used for the printable bitmap/PNG.
 * PDFs tend to move between apps (Files, AirDrop, third-party printer apps)
 * more predictably than plain images on iOS.
 *
 * jsPDF is dynamically imported so its (fairly large, html2canvas-pulling)
 * bundle only loads when a PDF is actually requested, not on initial page load.
 */
export async function renderTextToPdfBlob(text: string, widthPx: number = 384): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const canvas = renderReceiptCanvasScaled(text, widthPx, 2);

  const widthMm = 58;
  const pxPerMm = canvas.width / widthMm;
  const heightMm = canvas.height / pxPerMm;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [widthMm, heightMm]
  });

  const imgData = canvas.toDataURL('image/png');
  pdf.addImage(imgData, 'PNG', 0, 0, widthMm, heightMm);

  return pdf.output('blob');
}

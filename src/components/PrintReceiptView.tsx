import React from 'react';
import { usePosStore } from '../store/posStore';
import { generateReceiptText } from '../utils/escpos';

export const PrintReceiptView: React.FC = () => {
  const { activeReceiptForPreview, settings } = usePosStore();

  if (!activeReceiptForPreview) return null;

  const receiptText = generateReceiptText(activeReceiptForPreview, settings);

  return (
    <div className="printable-receipt-container hidden">
      <pre className="printable-receipt-text">
        {receiptText}
      </pre>
    </div>
  );
};

import { IInvoice } from '../../modules/invoices/invoice.model';

export function getFormattedDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

// Works with both mongoose Map and plain object (serialized JSON)
export function getCustomField(invoice: IInvoice, key: string): string | undefined {
  const cf = invoice.customFields as any;
  if (!cf) return undefined;
  if (typeof cf.get === 'function') return cf.get(key);
  return cf[key];
}

export function generateSignatureBlock(invoice: IInvoice): string {
  if (invoice.signatureType === 'none') return '';
  const brand = invoice.colorScheme || '#01019d';

  let sigContent = '';
  if (invoice.signatureType === 'font') {
    sigContent = `<div style="font-family: 'Dancing Script', cursive; font-size: 28px; color: ${brand}; line-height: 1; padding-bottom: 4px;">${invoice.signatureName || ''}</div>`;
  } else if (invoice.signatureType === 'draw' && invoice.signatureImageBase64) {
    sigContent = `<img src="${invoice.signatureImageBase64}" style="max-height: 60px; max-width: 200px; object-fit: contain; display: block;" />`;
  }

  return `
    <div style="display: inline-block; text-align: center; min-width: 180px;">
      <div style="min-height: 64px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 8px;">
        ${sigContent}
      </div>
      <div style="border-top: 1.5px solid #9ca3af; padding-top: 6px; margin-top: 0;">
        <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Authorized Signature</span>
      </div>
    </div>
  `;
}

export function generateBaseHtml(invoice: IInvoice, customStyles: string, contentBody: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Invoice ${invoice.invoiceNumber}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Dancing+Script:wght@700&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Inter', system-ui, sans-serif;
          background: #ffffff;
          color: #111827;
          line-height: 1.6;
        }
        ${customStyles}
      </style>
    </head>
    <body>
      ${contentBody}
    </body>
    </html>
  `;
}

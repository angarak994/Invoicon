import { IInvoice } from '../../modules/invoices/invoice.model';
import { getFormattedDate, generateBaseHtml } from './base.template';

function getCustomField(invoice: IInvoice, key: string): string | undefined {
  const cf = invoice.customFields as any;
  if (!cf) return undefined;
  if (typeof cf.get === 'function') return cf.get(key);
  return cf[key];
}

export function generateRetailTemplate(invoice: IInvoice): string {
  const formattedDate = getFormattedDate(invoice.invoiceDate);
  const brand = invoice.colorScheme || '#0ea5e9';

  const itemsHtml = invoice.lineItems.map((item) => `
    <tr>
      <td style="padding: 10px 16px; border-bottom: 1px solid #f3f4f6; font-size: 13px; color: #111827; font-weight: 500;">${item.description}</td>
      <td style="padding: 10px 16px; border-bottom: 1px solid #f3f4f6; text-align: center; font-size: 13px; color: #4b5563;">${item.quantity}</td>
      <td style="padding: 10px 16px; border-bottom: 1px solid #f3f4f6; text-align: right; font-size: 13px; color: #4b5563;">${invoice.currency} ${(item.unitPrice / 100).toFixed(2)}</td>
      <td style="padding: 10px 16px; border-bottom: 1px solid #f3f4f6; text-align: right; font-size: 13px; font-weight: 700; color: #111827;">${invoice.currency} ${(item.amount / 100).toFixed(2)}</td>
    </tr>
  `).join('');

  const storeId = getCustomField(invoice, 'storeId');
  const cashier = getCustomField(invoice, 'cashier');

  const customStyles = `
    body { padding: 40px; font-family: 'Inter', sans-serif; background: #ffffff; }
    .receipt-header { text-align: center; margin-bottom: 30px; }
    .receipt-logo { max-height: 80px; max-width: 200px; margin: 0 auto 16px; display: block; object-fit: contain; }
    .store-name { font-size: 28px; font-weight: 800; color: #111827; letter-spacing: -0.5px; margin-bottom: 4px; }
    .store-address { font-size: 13px; color: #6b7280; line-height: 1.5; margin-bottom: 16px; }
    
    .receipt-meta { display: flex; justify-content: space-between; border-top: 1px dashed #d1d5db; border-bottom: 1px dashed #d1d5db; padding: 12px 0; margin-bottom: 24px; font-size: 12px; color: #4b5563; }
    .meta-col { flex: 1; }
    .meta-col.right { text-align: right; }
    
    .bill-to { margin-bottom: 24px; padding: 16px; background: #f9fafb; border-radius: 8px; border: 1px solid #f3f4f6; }
    .bill-to-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin-bottom: 6px; }
    .bill-to-name { font-size: 14px; font-weight: 700; color: #111827; }
    
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: white; text-transform: uppercase; background: ${brand}; letter-spacing: 0.05em; }
    th.right { text-align: right; }
    th.center { text-align: center; }
    
    .totals-area { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .policy-notes { width: 50%; font-size: 11px; color: #6b7280; line-height: 1.5; padding-right: 20px; }
    .totals-table { width: 300px; border-collapse: collapse; }
    .totals-table td { padding: 8px 16px; font-size: 13px; color: #4b5563; text-align: right; }
    .totals-table td:first-child { text-align: left; }
    .total-row td { font-size: 18px; font-weight: 800; color: #111827; border-top: 2px solid ${brand}; padding-top: 12px; margin-top: 4px; }
    
    .receipt-footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #d1d5db; }
    .barcode { font-size: 32px; letter-spacing: 4px; color: #111827; margin: 16px 0; font-family: monospace; }
  `;

  
  let customFieldsHtml = '';
  if (invoice.customFields) {
    const fields = invoice.customFields instanceof Map ? Object.fromEntries(invoice.customFields) : invoice.customFields;
    for (const [key, value] of Object.entries(fields)) {
      if (['storeId', 'cashier'].includes(key)) continue;
      customFieldsHtml += `<div><strong>${key}:</strong> ${value}</div>`;
    }
  }

  const contentBody = `
    <div class="receipt-header">
      ${invoice.logoUrl 
        ? `<img src="${invoice.logoUrl}" class="receipt-logo" />` 
        : `<div class="store-name">${invoice.fromName}</div>`
      }
      <div class="store-address">
        ${invoice.fromAddress ? invoice.fromAddress.replace(/\n/g, '<br/>') : ''}
        ${invoice.fromEmail ? `<br/>${invoice.fromEmail}` : ''}
      </div>
    </div>

    <div class="receipt-meta">
      <div class="meta-col">
        <div><strong>Receipt #:</strong> ${invoice.invoiceNumber}</div>
        <div><strong>Date:</strong> ${formattedDate}</div>
      </div>
      <div class="meta-col right">
        ${storeId ? `<div><strong>Store:</strong> ${storeId}</div>` : ''}
        ${cashier ? `<div><strong>Cashier:</strong> ${cashier}</div>` : ''}
        ${customFieldsHtml}
      </div>
    </div>

    ${invoice.toName ? `
    <div class="bill-to">
      <div class="bill-to-title">Customer</div>
      <div class="bill-to-name">${invoice.toName}</div>
      ${invoice.toAddress ? `<div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${invoice.toAddress.replace(/\n/g, '<br/>')}</div>` : ''}
    </div>
    ` : ''}

    <table>
      <thead>
        <tr>
          <th>Item Description</th>
          <th class="center" style="width: 15%;">Qty</th>
          <th class="right" style="width: 20%;">Price</th>
          <th class="right" style="width: 20%;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="totals-area">
      <div class="policy-notes">
        ${invoice.termsAndConditions ? `<strong>Return Policy:</strong><br/>${invoice.termsAndConditions.replace(/\n/g, '<br/>')}<br/><br/>` : ''}
        ${invoice.paymentInstructions ? `<strong>Payment Info:</strong><br/>${invoice.paymentInstructions.replace(/\n/g, '<br/>')}` : ''}
      </div>
      
      <div>
        <table class="totals-table">
          <tr>
            <td>Subtotal</td>
            <td>${invoice.currency} ${(invoice.subtotal / 100).toFixed(2)}</td>
          </tr>
          ${invoice.taxPercentage > 0 ? `
          <tr>
            <td>Tax (${invoice.taxPercentage}%)</td>
            <td>${invoice.currency} ${(invoice.taxAmount / 100).toFixed(2)}</td>
          </tr>
          ` : ''}
          ${invoice.discountAmount > 0 ? `
          <tr>
            <td>Discount</td>
            <td style="color: #ef4444;">− ${invoice.currency} ${(invoice.discountAmount / 100).toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr class="total-row">
            <td>TOTAL</td>
            <td>${invoice.currency} ${(invoice.total / 100).toFixed(2)}</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="receipt-footer">
      <div style="font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 8px;">
        ${invoice.notes || 'Thank you for shopping with us!'}
      </div>
      <div class="barcode">*${invoice.invoiceNumber}*</div>
      <div style="font-size: 10px; color: #9ca3af;">Generated by Invoicon</div>
    </div>
  `;

  return generateBaseHtml(invoice, customStyles, contentBody);
}

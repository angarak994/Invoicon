import { IInvoice } from '../../modules/invoices/invoice.model';
import { getFormattedDate, generateSignatureBlock, generateBaseHtml } from './base.template';

export function generateStandardTemplate(invoice: IInvoice): string {
  const formattedDate = getFormattedDate(invoice.invoiceDate);
  const formattedDueDate = invoice.dueDate ? getFormattedDate(invoice.dueDate) : 'N/A';
  const brand = invoice.colorScheme || '#000000'; // Standard template uses more neutral colors but respects brand

  const itemsHtml = invoice.lineItems.map((item) => `
    <tr>
      <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #374151;">${item.description}</td>
      <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 13px; color: #6b7280;">${item.quantity}</td>
      <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 13px; color: #6b7280;">${invoice.currency} ${(item.unitPrice / 100).toFixed(2)}</td>
      <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 13px; font-weight: 600; color: #111827;">${invoice.currency} ${(item.amount / 100).toFixed(2)}</td>
    </tr>
  `).join('');

  const customStyles = `
    body { padding: 50px; font-family: 'Inter', sans-serif; background: #ffffff; }
    .header-table { width: 100%; margin-bottom: 40px; }
    .header-table td { vertical-align: top; }
    .invoice-title { font-size: 32px; font-weight: 800; color: #111827; letter-spacing: -1px; margin-bottom: 4px; text-transform: uppercase; }
    .invoice-number { font-size: 14px; color: #6b7280; font-family: monospace; }
    .brand-logo { max-height: 64px; max-width: 180px; object-fit: contain; }
    .brand-text { font-size: 24px; font-weight: 800; color: ${brand}; letter-spacing: -0.5px; }
    
    .info-section { display: flex; justify-content: space-between; margin-bottom: 40px; padding-top: 30px; border-top: 2px solid ${brand}; }
    .info-block { width: 30%; }
    .info-label { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
    .info-value-title { font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 4px; }
    .info-value-text { font-size: 12px; color: #6b7280; line-height: 1.6; }
    
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #f9fafb; padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e5e7eb; }
    th.right { text-align: right; }
    th.center { text-align: center; }
    
    .summary-container { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 20px; page-break-inside: avoid; }
    .payment-terms { width: 50%; font-size: 12px; color: #6b7280; line-height: 1.6; }
    .payment-terms-title { font-size: 11px; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
    
    .totals-table { width: 320px; border-collapse: collapse; }
    .totals-table td { padding: 10px 16px; font-size: 13px; color: #374151; border-bottom: 1px solid #f3f4f6; text-align: right; }
    .totals-table td:first-child { text-align: left; font-weight: 500; }
    .totals-table tr.total-row td { font-size: 16px; font-weight: 800; color: ${brand}; border-bottom: none; border-top: 2px solid #e5e7eb; padding-top: 16px; }
    
    .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: flex-end; page-break-inside: avoid; }
    .footer-notes { font-size: 11px; color: #9ca3af; max-width: 60%; }
  `;

  
  let customFieldsHtml = '';
  if (invoice.customFields) {
    const fields = invoice.customFields instanceof Map ? Object.fromEntries(invoice.customFields) : invoice.customFields;
    for (const [key, value] of Object.entries(fields)) {
      customFieldsHtml += `
        <div style="margin-bottom: 12px;">
          <div class="info-label" style="margin-bottom: 4px;">${key}</div>
          <div class="info-value-title" style="font-size: 13px;">${value}</div>
        </div>
      `;
    }
  }

  const contentBody = `
    <table class="header-table">
      <tr>
        <td>
          ${invoice.logoUrl 
            ? `<img src="${invoice.logoUrl}" class="brand-logo" />` 
            : `<div class="brand-text">${invoice.fromName}</div>`
          }
        </td>
        <td style="text-align: right;">
          <div class="invoice-title">Invoice</div>
          <div class="invoice-number">${invoice.invoiceNumber}</div>
        </td>
      </tr>
    </table>

    <div class="info-section">
      <div class="info-block">
        <div class="info-label">From</div>
        <div class="info-value-title">${invoice.fromName}</div>
        <div class="info-value-text">
          ${invoice.fromAddress ? invoice.fromAddress.replace(/\n/g, '<br/>') + '<br/>' : ''}
          ${invoice.fromEmail || ''}
        </div>
      </div>
      <div class="info-block">
        <div class="info-label">Billed To</div>
        <div class="info-value-title">${invoice.toName}</div>
        <div class="info-value-text">
          ${invoice.toAddress ? invoice.toAddress.replace(/\n/g, '<br/>') + '<br/>' : ''}
          ${invoice.toEmail || ''}
        </div>
      </div>
      <div class="info-block" style="text-align: right;">
        <div style="margin-bottom: 12px;">
          <div class="info-label" style="margin-bottom: 4px;">Invoice Date</div>
          <div class="info-value-title" style="font-size: 13px;">${formattedDate}</div>
        </div>
        <div>
          <div class="info-label" style="margin-bottom: 4px;">Due Date</div>
          <div class="info-value-title" style="font-size: 13px;">${formattedDueDate}</div>
        </div>
        ${customFieldsHtml}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="center" style="width: 12%;">Qty</th>
          <th class="right" style="width: 20%;">Unit Price</th>
          <th class="right" style="width: 20%;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="summary-container">
      <div class="payment-terms">
        ${invoice.paymentInstructions ? `
          <div style="margin-bottom: 16px;">
            <div class="payment-terms-title">Payment Instructions</div>
            <div>${invoice.paymentInstructions.replace(/\n/g, '<br/>')}</div>
          </div>
        ` : ''}
        ${invoice.termsAndConditions ? `
          <div>
            <div class="payment-terms-title">Terms & Conditions</div>
            <div>${invoice.termsAndConditions.replace(/\n/g, '<br/>')}</div>
          </div>
        ` : ''}
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
            <td>Total Due</td>
            <td>${invoice.currency} ${(invoice.total / 100).toFixed(2)}</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="footer">
      <div class="footer-notes">
        ${invoice.notes ? invoice.notes.replace(/\n/g, '<br/>') : 'Thank you for your business.'}
      </div>
      ${generateSignatureBlock(invoice)}
    </div>
  `;

  return generateBaseHtml(invoice, customStyles, contentBody);
}

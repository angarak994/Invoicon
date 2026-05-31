import { IInvoice } from '../../modules/invoices/invoice.model';
import { getFormattedDate, generateSignatureBlock, generateBaseHtml } from './base.template';

export function generateStartupTemplate(invoice: IInvoice): string {
  const formattedDate = getFormattedDate(invoice.invoiceDate);
  const formattedDueDate = invoice.dueDate ? getFormattedDate(invoice.dueDate) : 'N/A';
  const brand = invoice.colorScheme || '#14b8a6'; // default startup teal

  const itemsHtml = invoice.lineItems.map((item) => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #334155; font-size: 14px; color: #f8fafc;">${item.description}</td>
      <td style="padding: 16px 0; border-bottom: 1px solid #334155; text-align: center; font-size: 14px; color: #94a3b8; font-family: monospace;">${item.quantity}</td>
      <td style="padding: 16px 0; border-bottom: 1px solid #334155; text-align: right; font-size: 14px; color: #94a3b8; font-family: monospace;">${invoice.currency} ${(item.unitPrice / 100).toFixed(2)}</td>
      <td style="padding: 16px 0; border-bottom: 1px solid #334155; text-align: right; font-size: 14px; font-weight: 700; color: #f8fafc; font-family: monospace;">${invoice.currency} ${(item.amount / 100).toFixed(2)}</td>
    </tr>
  `).join('');

  const customStyles = `
    body { padding: 50px; font-family: 'Inter', sans-serif; background: #0f172a; color: #f8fafc; }
    .header-table { width: 100%; margin-bottom: 40px; border-bottom: 1px solid #334155; padding-bottom: 30px; }
    .header-table td { vertical-align: bottom; }
    .invoice-title { font-size: 12px; font-weight: 800; color: ${brand}; letter-spacing: 2px; margin-bottom: 8px; text-transform: uppercase; }
    .invoice-number { font-size: 32px; font-weight: 300; color: #f8fafc; font-family: monospace; }
    .brand-logo { max-height: 48px; max-width: 180px; object-fit: contain; }
    .brand-text { font-size: 20px; font-weight: 700; color: #ffffff; }
    
    .info-section { display: flex; justify-content: space-between; margin-bottom: 50px; }
    .info-block { width: 30%; }
    .info-label { font-size: 10px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
    .info-value-title { font-size: 15px; font-weight: 600; color: #f8fafc; margin-bottom: 4px; }
    .info-value-text { font-size: 13px; color: #94a3b8; line-height: 1.6; }
    
    table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
    th { border-bottom: 1px solid #475569; padding: 12px 0; text-align: left; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    th.right { text-align: right; }
    th.center { text-align: center; }
    
    .summary-container { display: flex; justify-content: space-between; align-items: flex-start; page-break-inside: avoid; }
    .terms-box { width: 45%; }
    
    .terms-section { margin-bottom: 24px; }
    .terms-title { font-size: 11px; font-weight: 600; color: ${brand}; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
    .terms-text { font-size: 12px; color: #94a3b8; line-height: 1.6; }
    
    .totals-table { width: 300px; border-collapse: collapse; }
    .totals-table td { padding: 12px 0; font-size: 13px; color: #94a3b8; font-family: monospace; text-align: right; border-bottom: 1px solid #1e293b; }
    .totals-table td:first-child { text-align: left; font-family: 'Inter', sans-serif; }
    .totals-table tr.total-row td { font-size: 16px; font-weight: 700; color: #ffffff; border-bottom: none; border-top: 1px solid #475569; padding-top: 16px; }
    .totals-table tr.total-row td:last-child { color: ${brand}; }
    
    .footer { margin-top: 60px; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; page-break-inside: avoid; }
    .footer-notes { font-size: 12px; color: #64748b; max-width: 60%; }
  `;

  
  let customFieldsHtml = '';
  if (invoice.customFields) {
    const fields = invoice.customFields instanceof Map ? Object.fromEntries(invoice.customFields) : invoice.customFields;
    for (const [key, value] of Object.entries(fields)) {
      customFieldsHtml += `
        <div style="margin-bottom: 16px;">
          <div class="info-label" style="margin-bottom: 4px;">${key}</div>
          <div class="info-value-title" style="font-family: monospace;">${value}</div>
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
        <div style="margin-bottom: 16px;">
          <div class="info-label" style="margin-bottom: 4px;">Invoice Date</div>
          <div class="info-value-title" style="font-family: monospace;">${formattedDate}</div>
        </div>
        <div>
          <div class="info-label" style="margin-bottom: 4px;">Due Date</div>
          <div class="info-value-title" style="font-family: monospace; color: ${brand};">${formattedDueDate}</div>
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
      <div class="terms-box">
        ${invoice.paymentInstructions ? `
          <div class="terms-section">
            <div class="terms-title">Payment Instructions</div>
            <div class="terms-text">${invoice.paymentInstructions.replace(/\n/g, '<br/>')}</div>
          </div>
        ` : ''}
        ${invoice.termsAndConditions ? `
          <div class="terms-section">
            <div class="terms-title">Terms & Conditions</div>
            <div class="terms-text">${invoice.termsAndConditions.replace(/\n/g, '<br/>')}</div>
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
        ${invoice.notes ? invoice.notes.replace(/\n/g, '<br/>') : '// Thank you.'}
      </div>
      ${generateSignatureBlock(invoice)}
    </div>
  `;

  return generateBaseHtml(invoice, customStyles, contentBody);
}

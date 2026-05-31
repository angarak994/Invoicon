import { IInvoice } from '../../modules/invoices/invoice.model';
import { getFormattedDate, generateSignatureBlock, generateBaseHtml } from './base.template';

export function generateElegantTemplate(invoice: IInvoice): string {
  const formattedDate = getFormattedDate(invoice.invoiceDate);
  const formattedDueDate = invoice.dueDate ? getFormattedDate(invoice.dueDate) : 'N/A';
  const brand = invoice.colorScheme || '#111827'; // default elegant dark charcoal

  const itemsHtml = invoice.lineItems.map((item) => `
    <tr>
      <td style="padding: 16px 8px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #374151; font-family: 'Georgia', serif;">${item.description}</td>
      <td style="padding: 16px 8px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 13px; color: #6b7280;">${item.quantity}</td>
      <td style="padding: 16px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 13px; color: #6b7280;">${invoice.currency} ${(item.unitPrice / 100).toFixed(2)}</td>
      <td style="padding: 16px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 13px; font-weight: 700; color: #111827;">${invoice.currency} ${(item.amount / 100).toFixed(2)}</td>
    </tr>
  `).join('');

  const customStyles = `
    body { padding: 60px; font-family: 'Inter', sans-serif; background: #fafafa; color: #111827; }
    .page-wrapper { background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header-table { width: 100%; margin-bottom: 30px; }
    .header-table td { vertical-align: top; }
    .invoice-title { font-size: 32px; font-weight: 300; font-family: 'Georgia', serif; color: ${brand}; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 4px; text-align: center; }
    .invoice-number { font-size: 12px; color: #6b7280; letter-spacing: 2px; text-align: center; margin-bottom: 40px; }
    .brand-logo { max-height: 70px; max-width: 160px; object-fit: contain; margin: 0 auto; display: block; }
    .brand-text { font-size: 24px; font-family: 'Georgia', serif; font-weight: 400; color: ${brand}; text-align: center; margin-bottom: 20px; }
    
    .divider { height: 1px; width: 60px; background: ${brand}; margin: 20px auto 40px; }
    
    .info-section { display: flex; justify-content: space-between; margin-bottom: 50px; }
    .info-block { width: 30%; }
    .info-label { font-size: 10px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 12px; }
    .info-value-title { font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 4px; font-family: 'Georgia', serif; }
    .info-value-text { font-size: 12px; color: #4b5563; line-height: 1.8; }
    
    table { width: 100%; border-collapse: collapse; margin-bottom: 40px; border-top: 2px solid ${brand}; border-bottom: 2px solid ${brand}; }
    th { padding: 16px 8px; text-align: left; font-size: 10px; font-weight: 600; color: #111827; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #d1d5db; }
    th.right { text-align: right; }
    th.center { text-align: center; }
    
    .summary-container { display: flex; justify-content: space-between; align-items: flex-start; page-break-inside: avoid; margin-top: 40px; }
    .terms-box { width: 50%; padding-right: 40px; }
    
    .terms-section { margin-bottom: 24px; }
    .terms-title { font-size: 10px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 12px; }
    .terms-text { font-size: 11px; color: #4b5563; line-height: 1.8; font-family: 'Georgia', serif; }
    
    .totals-table { width: 100%; border-collapse: collapse; }
    .totals-table td { padding: 12px 8px; font-size: 13px; color: #4b5563; text-align: right; border-bottom: 1px solid #f3f4f6; }
    .totals-table td:first-child { text-align: left; }
    .totals-table tr.total-row td { font-size: 16px; font-weight: 700; color: ${brand}; border-bottom: none; border-top: 1px solid #d1d5db; padding-top: 16px; }
    
    .footer { margin-top: 60px; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; page-break-inside: avoid; }
    .footer-notes { font-size: 11px; color: #6b7280; max-width: 60%; font-family: 'Georgia', serif; font-style: italic; }
  `;

  
  let customFieldsHtml = '';
  if (invoice.customFields) {
    const fields = invoice.customFields instanceof Map ? Object.fromEntries(invoice.customFields) : invoice.customFields;
    for (const [key, value] of Object.entries(fields)) {
      customFieldsHtml += `
        <div style="margin-bottom: 16px;">
          <div class="info-label" style="margin-bottom: 4px;">${key}</div>
          <div class="info-value-title" style="font-family: 'Inter', sans-serif; font-size: 13px;">${value}</div>
        </div>
      `;
    }
  }

  const contentBody = `
    <div class="page-wrapper">
      <div style="text-align: center; margin-bottom: 20px;">
        ${invoice.logoUrl 
          ? `<img src="${invoice.logoUrl}" class="brand-logo" />` 
          : `<div class="brand-text">${invoice.fromName}</div>`
        }
      </div>
      
      <div class="invoice-title">Invoice</div>
      <div class="invoice-number">${invoice.invoiceNumber}</div>
      <div class="divider"></div>

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
            <div class="info-value-title" style="font-family: 'Inter', sans-serif; font-size: 13px;">${formattedDate}</div>
          </div>
          <div>
            <div class="info-label" style="margin-bottom: 4px;">Due Date</div>
            <div class="info-value-title" style="font-family: 'Inter', sans-serif; font-size: 13px;">${formattedDueDate}</div>
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
        
        <div style="width: 300px;">
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
          ${invoice.notes ? invoice.notes.replace(/\n/g, '<br/>') : 'Thank you for your valued business.'}
        </div>
        ${generateSignatureBlock(invoice)}
      </div>
    </div>
  `;

  return generateBaseHtml(invoice, customStyles, contentBody);
}

import { IInvoice } from '../../modules/invoices/invoice.model';
import { getFormattedDate, generateSignatureBlock, generateBaseHtml } from './base.template';

export function generateCreativeTemplate(invoice: IInvoice): string {
  const formattedDate = getFormattedDate(invoice.invoiceDate);
  const formattedDueDate = invoice.dueDate ? getFormattedDate(invoice.dueDate) : 'N/A';
  const brand = invoice.colorScheme || '#ec4899'; // default creative pink

  const itemsHtml = invoice.lineItems.map((item) => `
    <tr>
      <td style="padding: 16px; border-bottom: 2px solid #f1f5f9; font-size: 14px; color: #1e293b; font-weight: 600;">${item.description}</td>
      <td style="padding: 16px; border-bottom: 2px solid #f1f5f9; text-align: center; font-size: 14px; color: #64748b; font-weight: 500;">${item.quantity}</td>
      <td style="padding: 16px; border-bottom: 2px solid #f1f5f9; text-align: right; font-size: 14px; color: #64748b; font-weight: 500;">${invoice.currency} ${(item.unitPrice / 100).toFixed(2)}</td>
      <td style="padding: 16px; border-bottom: 2px solid #f1f5f9; text-align: right; font-size: 15px; font-weight: 800; color: ${brand};">${invoice.currency} ${(item.amount / 100).toFixed(2)}</td>
    </tr>
  `).join('');

  const customStyles = `
    body { padding: 0; margin: 0; font-family: 'Inter', sans-serif; background: #ffffff; }
    .page-wrapper { padding: 40px 60px; }
    .header-bar { height: 16px; width: 100%; background: ${brand}; margin-bottom: 40px; }
    .header-table { width: 100%; margin-bottom: 50px; }
    .header-table td { vertical-align: top; }
    .invoice-title { font-size: 48px; font-weight: 900; color: #0f172a; letter-spacing: -2px; margin-bottom: 8px; text-transform: uppercase; line-height: 1; }
    .invoice-number { font-size: 16px; color: ${brand}; font-weight: 700; letter-spacing: 1px; }
    .brand-logo { max-height: 80px; max-width: 200px; object-fit: contain; }
    .brand-text { font-size: 28px; font-weight: 900; color: #0f172a; letter-spacing: -1px; }
    
    .info-section { display: flex; justify-content: space-between; margin-bottom: 50px; background: #f8fafc; padding: 30px; border-radius: 16px; }
    .info-block { width: 30%; }
    .info-label { font-size: 11px; font-weight: 800; color: ${brand}; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 12px; }
    .info-value-title { font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
    .info-value-text { font-size: 13px; color: #475569; line-height: 1.6; font-weight: 500; }
    
    table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
    th { background: #0f172a; padding: 16px; text-align: left; font-size: 12px; font-weight: 700; color: #ffffff; text-transform: uppercase; letter-spacing: 0.1em; }
    th.right { text-align: right; }
    th.center { text-align: center; }
    th:first-child { border-top-left-radius: 12px; border-bottom-left-radius: 12px; }
    th:last-child { border-top-right-radius: 12px; border-bottom-right-radius: 12px; }
    
    .summary-container { display: flex; justify-content: space-between; align-items: flex-start; page-break-inside: avoid; }
    .terms-box { width: 50%; }
    
    .terms-section { background: #f8fafc; padding: 24px; border-radius: 16px; margin-bottom: 20px; border-left: 4px solid ${brand}; }
    .terms-title { font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px; }
    .terms-text { font-size: 12px; color: #475569; line-height: 1.6; font-weight: 500; }
    
    .totals-table { width: 340px; border-collapse: collapse; background: #f8fafc; border-radius: 16px; overflow: hidden; }
    .totals-table td { padding: 16px 24px; font-size: 14px; color: #475569; font-weight: 600; text-align: right; border-bottom: 1px solid #e2e8f0; }
    .totals-table td:first-child { text-align: left; }
    .totals-table tr.total-row { background: #0f172a; }
    .totals-table tr.total-row td { font-size: 20px; font-weight: 900; color: #ffffff; border-bottom: none; }
    .totals-table tr.total-row td:last-child { color: ${brand}; }
    
    .footer { margin-top: 60px; padding-top: 30px; border-top: 2px dashed #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; page-break-inside: avoid; }
    .footer-notes { font-size: 13px; color: #64748b; max-width: 60%; font-weight: 500; font-style: italic; }
  `;

  
  let customFieldsHtml = '';
  if (invoice.customFields) {
    const fields = invoice.customFields instanceof Map ? Object.fromEntries(invoice.customFields) : invoice.customFields;
    for (const [key, value] of Object.entries(fields)) {
      customFieldsHtml += `
        <div style="margin-bottom: 20px;">
          <div class="info-label" style="margin-bottom: 6px;">${key}</div>
          <div class="info-value-title">${value}</div>
        </div>
      `;
    }
  }

  const contentBody = `
    <div class="header-bar"></div>
    <div class="page-wrapper">
      <table class="header-table">
        <tr>
          <td>
            <div class="invoice-title">Invoice</div>
            <div class="invoice-number"># ${invoice.invoiceNumber}</div>
          </td>
          <td style="text-align: right;">
            ${invoice.logoUrl 
              ? `<img src="${invoice.logoUrl}" class="brand-logo" />` 
              : `<div class="brand-text">${invoice.fromName}</div>`
            }
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
          <div style="margin-bottom: 20px;">
            <div class="info-label" style="margin-bottom: 6px;">Invoice Date</div>
            <div class="info-value-title">${formattedDate}</div>
          </div>
          <div>
            <div class="info-label" style="margin-bottom: 6px;">Due Date</div>
            <div class="info-value-title">${formattedDueDate}</div>
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
              <td style="color: ${brand};">− ${invoice.currency} ${(invoice.discountAmount / 100).toFixed(2)}</td>
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
          ${invoice.notes ? invoice.notes.replace(/\n/g, '<br/>') : 'Thank you for your business! We appreciate working with you.'}
        </div>
        ${generateSignatureBlock(invoice)}
      </div>
    </div>
  `;

  return generateBaseHtml(invoice, customStyles, contentBody);
}

import { IInvoice } from '../../modules/invoices/invoice.model';
import { getFormattedDate, generateSignatureBlock, generateBaseHtml, getCustomField } from './base.template';

export function generateConstructionTemplate(invoice: IInvoice): string {
  const formattedDate = getFormattedDate(invoice.invoiceDate);
  const formattedDueDate = invoice.dueDate ? getFormattedDate(invoice.dueDate) : 'N/A';
  const brand = invoice.colorScheme || '#f59e0b'; // Amber default for construction

  const itemsHtml = invoice.lineItems.map((item) => `
    <tr>
      <td style="padding: 12px 16px; border: 1px solid #e5e7eb; font-size: 13px; color: #1f2937;">${item.description}</td>
      <td style="padding: 12px 16px; border: 1px solid #e5e7eb; text-align: center; font-size: 13px; color: #4b5563;">${item.quantity}</td>
      <td style="padding: 12px 16px; border: 1px solid #e5e7eb; text-align: right; font-size: 13px; color: #4b5563;">${invoice.currency} ${(item.unitPrice / 100).toFixed(2)}</td>
      <td style="padding: 12px 16px; border: 1px solid #e5e7eb; text-align: right; font-size: 13px; font-weight: 700; color: #111827;">${invoice.currency} ${(item.amount / 100).toFixed(2)}</td>
    </tr>
  `).join('');

  const projectName = getCustomField(invoice, 'projectName');
  const projectRef = getCustomField(invoice, 'projectRef');
  const milestone = getCustomField(invoice, 'milestone');

  const customStyles = `
    body { padding: 48px; font-family: 'Inter', sans-serif; background: #ffffff; }
    .header { display: flex; justify-content: space-between; align-items: stretch; margin-bottom: 30px; }
    .company-info { flex: 1; }
    .brand-logo { max-height: 64px; max-width: 220px; object-fit: contain; margin-bottom: 12px; }
    .brand-name { font-size: 28px; font-weight: 900; color: #111827; text-transform: uppercase; letter-spacing: -0.5px; margin-bottom: 8px; }
    
    .invoice-badge { background: ${brand}; color: white; padding: 12px 24px; text-align: right; min-width: 200px; }
    .invoice-badge h1 { font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px; }
    .invoice-badge .num { font-size: 16px; font-family: monospace; font-weight: 600; }
    
    .project-details { background: #f9fafb; border: 1px solid #e5e7eb; padding: 16px 20px; margin-bottom: 30px; display: flex; flex-wrap: wrap; gap: 24px; }
    .detail-item { min-width: 150px; }
    .detail-label { font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; }
    .detail-value { font-size: 14px; font-weight: 600; color: #111827; }
    
    .parties { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .party-col { width: 45%; }
    .party-title { font-size: 11px; font-weight: 700; color: white; background: #374151; padding: 6px 12px; text-transform: uppercase; margin-bottom: 12px; }
    .party-name { font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 4px; }
    .party-contact { font-size: 13px; color: #4b5563; line-height: 1.6; }
    
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 2px solid #374151; }
    th { background: #f3f4f6; padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 800; color: #374151; text-transform: uppercase; border: 1px solid #e5e7eb; }
    th.center { text-align: center; }
    th.right { text-align: right; }
    
    .bottom-section { display: flex; justify-content: space-between; align-items: flex-start; }
    .notes-terms { width: 55%; }
    .section-title { font-size: 12px; font-weight: 800; color: #374151; text-transform: uppercase; margin-bottom: 8px; border-bottom: 2px solid ${brand}; padding-bottom: 4px; display: inline-block; }
    .text-content { font-size: 12px; color: #4b5563; line-height: 1.6; margin-bottom: 24px; }
    
    .totals { width: 35%; border: 2px solid #374151; }
    .totals-row { display: flex; justify-content: space-between; padding: 12px 16px; font-size: 14px; color: #374151; border-bottom: 1px solid #e5e7eb; }
    .totals-row:last-child { border-bottom: none; }
    .totals-row.final { background: #374151; color: white; font-weight: 800; font-size: 18px; }
    .totals-row.final span:last-child { color: ${brand}; }
    
    .footer { margin-top: 50px; display: flex; justify-content: flex-end; }
  `;

  
  let customFieldsHtml = '';
  if (invoice.customFields) {
    const fields = invoice.customFields instanceof Map ? Object.fromEntries(invoice.customFields) : invoice.customFields;
    for (const [key, value] of Object.entries(fields)) {
      if (['projectName', 'projectRef', 'milestone'].includes(key)) continue;
      customFieldsHtml += `
      <div class="detail-item">
        <div class="detail-label">${key}</div>
        <div class="detail-value">${value}</div>
      </div>`;
    }
  }

  const contentBody = `
    <div class="header">
      <div class="company-info">
        ${invoice.logoUrl 
          ? `<img src="${invoice.logoUrl}" class="brand-logo" />` 
          : `<div class="brand-name">${invoice.fromName}</div>`
        }
        <div style="font-size: 12px; color: #4b5563; line-height: 1.5; max-width: 250px;">
          ${invoice.fromAddress ? invoice.fromAddress.replace(/\n/g, '<br/>') : ''}
          ${invoice.fromEmail ? `<br/>${invoice.fromEmail}` : ''}
        </div>
      </div>
      <div class="invoice-badge">
        <h1>Invoice</h1>
        <div class="num">#${invoice.invoiceNumber}</div>
      </div>
    </div>

    ${projectName || projectRef || milestone ? `
    <div class="project-details">
      ${projectName ? `
      <div class="detail-item">
        <div class="detail-label">Project Name</div>
        <div class="detail-value">${projectName}</div>
      </div>` : ''}
      ${projectRef ? `
      <div class="detail-item">
        <div class="detail-label">Project Ref / PO</div>
        <div class="detail-value">${projectRef}</div>
      </div>` : ''}
      ${milestone ? `
      <div class="detail-item">
        <div class="detail-label">Milestone</div>
        <div class="detail-value">${milestone}</div>
      </div>` : ''}
      ${customFieldsHtml}
    </div>
    ` : ''}

    <div class="parties">
      <div class="party-col">
        <div class="party-title">Bill To</div>
        <div class="party-name">${invoice.toName}</div>
        <div class="party-contact">
          ${invoice.toAddress ? invoice.toAddress.replace(/\n/g, '<br/>') : ''}
          ${invoice.toEmail ? `<br/>${invoice.toEmail}` : ''}
        </div>
      </div>
      <div class="party-col" style="display: flex; gap: 30px; justify-content: flex-end;">
        <div>
          <div class="detail-label">Invoice Date</div>
          <div class="detail-value">${formattedDate}</div>
        </div>
        <div>
          <div class="detail-label">Payment Due</div>
          <div class="detail-value" style="color: #ef4444;">${formattedDueDate}</div>
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description of Work / Materials</th>
          <th class="center" style="width: 10%;">Qty</th>
          <th class="right" style="width: 20%;">Rate</th>
          <th class="right" style="width: 20%;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="bottom-section">
      <div class="notes-terms">
        ${invoice.notes ? `
          <div class="section-title">Notes</div>
          <div class="text-content">${invoice.notes.replace(/\n/g, '<br/>')}</div>
        ` : ''}
        
        ${invoice.paymentInstructions ? `
          <div class="section-title">Payment Instructions</div>
          <div class="text-content">${invoice.paymentInstructions.replace(/\n/g, '<br/>')}</div>
        ` : ''}
        
        ${invoice.termsAndConditions ? `
          <div class="section-title">Terms & Conditions</div>
          <div class="text-content">${invoice.termsAndConditions.replace(/\n/g, '<br/>')}</div>
        ` : ''}
      </div>
      
      <div class="totals">
        <div class="totals-row">
          <span>Subtotal</span>
          <span>${invoice.currency} ${(invoice.subtotal / 100).toFixed(2)}</span>
        </div>
        ${invoice.taxPercentage > 0 ? `
        <div class="totals-row">
          <span>Tax (${invoice.taxPercentage}%)</span>
          <span>${invoice.currency} ${(invoice.taxAmount / 100).toFixed(2)}</span>
        </div>
        ` : ''}
        ${invoice.discountAmount > 0 ? `
        <div class="totals-row">
          <span>Discount</span>
          <span style="color: #ef4444;">− ${invoice.currency} ${(invoice.discountAmount / 100).toFixed(2)}</span>
        </div>
        ` : ''}
        <div class="totals-row final">
          <span>Total</span>
          <span>${invoice.currency} ${(invoice.total / 100).toFixed(2)}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      ${generateSignatureBlock(invoice)}
    </div>
  `;

  return generateBaseHtml(invoice, customStyles, contentBody);
}

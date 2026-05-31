import { IInvoice } from '../../modules/invoices/invoice.model';
import { getFormattedDate, generateSignatureBlock, generateBaseHtml, getCustomField } from './base.template';

export function generateRentalTemplate(invoice: IInvoice): string {
  const formattedDate = getFormattedDate(invoice.invoiceDate);
  const formattedDueDate = invoice.dueDate ? getFormattedDate(invoice.dueDate) : 'N/A';
  const brand = invoice.colorScheme || '#10b981'; // Green default for property

  const itemsHtml = invoice.lineItems.map((item, _i) => `
    <tr style="background: ${_i % 2 === 0 ? '#f8fafc' : '#ffffff'};">
      <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155;">${item.description}</td>
      <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 13px; color: #64748b;">${invoice.currency} ${(item.unitPrice / 100).toFixed(2)}</td>
      <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 13px; font-weight: 700; color: #0f172a;">${invoice.currency} ${(item.amount / 100).toFixed(2)}</td>
    </tr>
  `).join('');

  const propertyName = getCustomField(invoice, 'propertyName');
  const unitNumber = getCustomField(invoice, 'unitNumber');
  const rentPeriod = getCustomField(invoice, 'rentPeriod');

  const customStyles = `
    body { padding: 48px; font-family: 'Inter', sans-serif; background: #ffffff; }
    .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 4px solid ${brand}; }
    .header-logo { max-height: 60px; max-width: 200px; object-fit: contain; }
    .header-text { font-size: 28px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
    .header-meta { text-align: right; }
    .invoice-title { font-size: 24px; font-weight: 800; color: ${brand}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
    
    .property-section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 32px; display: flex; justify-content: space-between; }
    .property-details h3 { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.1em; margin-bottom: 12px; }
    .property-name { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
    .property-unit { font-size: 14px; font-weight: 600; color: ${brand}; margin-bottom: 8px; }
    .rent-period { font-size: 13px; color: #64748b; display: inline-flex; align-items: center; background: #fff; padding: 4px 12px; border-radius: 16px; border: 1px solid #e2e8f0; }
    
    .parties-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
    .party-card { border-left: 3px solid #cbd5e1; padding-left: 16px; }
    .party-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.1em; margin-bottom: 8px; }
    .party-name { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
    .party-address { font-size: 12px; color: #64748b; line-height: 1.5; }
    
    .dates-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; }
    .date-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px; }
    .date-value { font-size: 14px; font-weight: 700; color: #0f172a; }
    .date-value.highlight { color: #ef4444; }
    
    table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
    th { padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #cbd5e1; }
    th.right { text-align: right; }
    
    .summary-section { display: flex; justify-content: space-between; align-items: flex-start; }
    .instructions { width: 50%; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px dashed #cbd5e1; }
    .instructions h4 { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 8px; }
    .instructions p { font-size: 12px; color: #475569; line-height: 1.6; }
    
    .totals-box { width: 320px; }
    .totals-row { display: flex; justify-content: space-between; padding: 12px 0; font-size: 14px; color: #475569; border-bottom: 1px solid #f1f5f9; }
    .totals-row.final { font-size: 18px; font-weight: 800; color: #0f172a; border-bottom: none; border-top: 2px solid #cbd5e1; padding-top: 16px; margin-top: 4px; }
    .totals-row.final span:last-child { color: ${brand}; }
    
    .footer { margin-top: 48px; border-top: 1px solid #e2e8f0; padding-top: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
  `;

  
  let customFieldsHtml = '';
  if (invoice.customFields) {
    const fields = invoice.customFields instanceof Map ? Object.fromEntries(invoice.customFields) : invoice.customFields;
    for (const [key, value] of Object.entries(fields)) {
      if (['propertyName', 'unitNumber', 'rentPeriod'].includes(key)) continue;
      customFieldsHtml += `
      <div>
        <div class="date-label">${key}</div>
        <div class="date-value">${value}</div>
      </div>`;
    }
  }

  const contentBody = `
    <div class="header">
      <div>
        ${invoice.logoUrl 
          ? `<img src="${invoice.logoUrl}" class="header-logo" />` 
          : `<div class="header-text">${invoice.fromName}</div>`
        }
      </div>
      <div class="header-meta">
        <div class="invoice-title">Rent Invoice</div>
        <div style="font-size: 14px; font-weight: 600; color: #64748b;"># ${invoice.invoiceNumber}</div>
      </div>
    </div>

    ${propertyName || unitNumber || rentPeriod ? `
    <div class="property-section">
      <div class="property-details">
        <h3>Property Details</h3>
        ${propertyName ? `<div class="property-name">${propertyName}</div>` : ''}
        ${unitNumber ? `<div class="property-unit">Unit: ${unitNumber}</div>` : ''}
        ${rentPeriod ? `<div class="rent-period">Period: ${rentPeriod}</div>` : ''}
      </div>
    </div>
    ` : ''}

    <div class="parties-grid">
      <div class="party-card">
        <div class="party-title">Landlord / Manager</div>
        <div class="party-name">${invoice.fromName}</div>
        <div class="party-address">
          ${invoice.fromAddress ? invoice.fromAddress.replace(/\n/g, '<br/>') : ''}
          ${invoice.fromEmail ? `<br/>${invoice.fromEmail}` : ''}
        </div>
      </div>
      <div class="party-card" style="border-left-color: ${brand};">
        <div class="party-title">Tenant</div>
        <div class="party-name">${invoice.toName}</div>
        <div class="party-address">
          ${invoice.toAddress ? invoice.toAddress.replace(/\n/g, '<br/>') : ''}
          ${invoice.toEmail ? `<br/>${invoice.toEmail}` : ''}
        </div>
      </div>
    </div>

    <div class="dates-grid">
      <div>
        <div class="date-label">Issue Date</div>
        <div class="date-value">${formattedDate}</div>
      </div>
      <div>
        <div class="date-label">Due Date</div>
        <div class="date-value highlight">${formattedDueDate}</div>
      </div>
      <div>
        <div class="date-label">Status</div>
        <div class="date-value" style="text-transform: capitalize;">${invoice.status}</div>
      </div>
      ${customFieldsHtml}
    </div>

    <table>
      <thead>
        <tr>
          <th>Charge Description</th>
          <th class="right" style="width: 25%;">Amount</th>
          <th class="right" style="width: 25%;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="summary-section">
      <div class="instructions">
        ${invoice.paymentInstructions ? `
          <h4>How to Pay</h4>
          <p style="margin-bottom: 16px;">${invoice.paymentInstructions.replace(/\n/g, '<br/>')}</p>
        ` : ''}
        ${invoice.termsAndConditions ? `
          <h4>Terms & Conditions</h4>
          <p>${invoice.termsAndConditions.replace(/\n/g, '<br/>')}</p>
        ` : ''}
      </div>
      
      <div class="totals-box">
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
          <span>Total Due</span>
          <span>${invoice.currency} ${(invoice.total / 100).toFixed(2)}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <div style="font-size: 11px; color: #94a3b8; max-width: 50%;">
        ${invoice.notes ? invoice.notes.replace(/\n/g, '<br/>') : ''}
      </div>
      ${generateSignatureBlock(invoice)}
    </div>
  `;

  return generateBaseHtml(invoice, customStyles, contentBody);
}

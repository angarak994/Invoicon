import { IInvoice } from '../../modules/invoices/invoice.model';
import { getFormattedDate, generateSignatureBlock, generateBaseHtml, getCustomField } from './base.template';

export function generateProfessionalTemplate(invoice: IInvoice): string {
  const formattedDate = getFormattedDate(invoice.invoiceDate);
  const formattedDueDate = invoice.dueDate ? getFormattedDate(invoice.dueDate) : 'N/A';
  const brand = invoice.colorScheme || '#3b82f6'; // Blue default for professional services

  const itemsHtml = invoice.lineItems.map((item) => `
    <tr>
      <td style="padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155; font-weight: 500;">${item.description}</td>
      <td style="padding: 16px; border-bottom: 1px solid #f1f5f9; text-align: center; font-size: 13px; color: #64748b;">${item.quantity}</td>
      <td style="padding: 16px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 13px; color: #64748b;">${invoice.currency} ${(item.unitPrice / 100).toFixed(2)}</td>
      <td style="padding: 16px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 13px; font-weight: 700; color: #0f172a;">${invoice.currency} ${(item.amount / 100).toFixed(2)}</td>
    </tr>
  `).join('');

  const servicesFor = getCustomField(invoice, 'servicesFor');
  const engagementType = getCustomField(invoice, 'engagementType');

  const customStyles = `
    body { padding: 50px 60px; font-family: 'Inter', sans-serif; background: #ffffff; }
    
    .document-header { text-align: center; margin-bottom: 50px; }
    .brand-logo { max-height: 70px; max-width: 250px; margin: 0 auto 16px; display: block; object-fit: contain; }
    .brand-name { font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; }
    .brand-contact { font-size: 11px; color: #64748b; letter-spacing: 0.5px; }
    
    .divider { height: 2px; background: ${brand}; width: 60px; margin: 30px auto; }
    
    .invoice-title { font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 4px; text-align: center; margin-bottom: 40px; }
    
    .grid-layout { display: flex; justify-content: space-between; margin-bottom: 50px; }
    .grid-col { width: 45%; }
    
    .label { font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; display: block; }
    .value { font-size: 14px; color: #334155; line-height: 1.6; }
    .value strong { color: #0f172a; font-weight: 600; display: block; margin-bottom: 4px; }
    
    .meta-table { width: 100%; border-collapse: collapse; }
    .meta-table td { padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
    .meta-table td:first-child { color: #64748b; width: 40%; }
    .meta-table td:last-child { color: #0f172a; font-weight: 600; text-align: right; }
    
    .services-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
    .services-table th { background: #f8fafc; padding: 12px 16px; text-align: left; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0; border-top: 1px solid #e2e8f0; }
    .services-table th.center { text-align: center; }
    .services-table th.right { text-align: right; }
    
    .financials { display: flex; justify-content: flex-end; margin-bottom: 50px; }
    .financials-box { width: 350px; }
    .fin-row { display: flex; justify-content: space-between; padding: 12px 0; font-size: 13px; color: #475569; border-bottom: 1px solid #f1f5f9; }
    .fin-row.total { font-size: 16px; font-weight: 700; color: #0f172a; border-bottom: none; border-top: 2px solid ${brand}; margin-top: 8px; padding-top: 16px; }
    
    .terms-section { margin-bottom: 40px; }
    .terms-box { background: #f8fafc; padding: 24px; border-radius: 8px; font-size: 12px; color: #475569; line-height: 1.6; margin-bottom: 16px; }
    .terms-box h4 { font-size: 10px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    
    .footer { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #e2e8f0; padding-top: 30px; }
    .signature-area { width: 250px; }
  `;

  
  let customFieldsHtml = '';
  if (invoice.customFields) {
    const fields = invoice.customFields instanceof Map ? Object.fromEntries(invoice.customFields) : invoice.customFields;
    for (const [key, value] of Object.entries(fields)) {
      if (['servicesFor', 'engagementType'].includes(key)) continue;
      customFieldsHtml += `
          <tr>
            <td>${key}</td>
            <td>${value}</td>
          </tr>`;
    }
  }

  const contentBody = `
    <div class="document-header">
      ${invoice.logoUrl 
        ? `<img src="${invoice.logoUrl}" class="brand-logo" />` 
        : `<div class="brand-name">${invoice.fromName}</div>`
      }
      <div class="brand-contact">
        ${invoice.fromAddress ? invoice.fromAddress.replace(/\n/g, ' • ') : ''}
        ${invoice.fromEmail ? ` • ${invoice.fromEmail}` : ''}
      </div>
      <div class="divider"></div>
      <div class="invoice-title">Statement of Services</div>
    </div>

    <div class="grid-layout">
      <div class="grid-col">
        <span class="label">Prepared For</span>
        <div class="value">
          <strong>${invoice.toName}</strong>
          ${invoice.toAddress ? invoice.toAddress.replace(/\n/g, '<br/>') : ''}
          ${invoice.toEmail ? `<br/>${invoice.toEmail}` : ''}
        </div>
      </div>
      <div class="grid-col">
        <table class="meta-table">
          <tr>
            <td>Invoice Number</td>
            <td>${invoice.invoiceNumber}</td>
          </tr>
          <tr>
            <td>Date of Issue</td>
            <td>${formattedDate}</td>
          </tr>
          <tr>
            <td>Payment Due</td>
            <td>${formattedDueDate}</td>
          </tr>
          ${engagementType ? `
          <tr>
            <td>Engagement Type</td>
            <td>${engagementType}</td>
          </tr>` : ''}
          ${servicesFor ? `
          <tr>
            <td>Services For</td>
            <td>${servicesFor}</td>
          </tr>` : ''}
          ${customFieldsHtml}
        </table>
      </div>
    </div>

    <table class="services-table">
      <thead>
        <tr>
          <th>Service Description</th>
          <th class="center" style="width: 15%;">Hours / Qty</th>
          <th class="right" style="width: 20%;">Rate</th>
          <th class="right" style="width: 20%;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="financials">
      <div class="financials-box">
        <div class="fin-row">
          <span>Subtotal</span>
          <span>${invoice.currency} ${(invoice.subtotal / 100).toFixed(2)}</span>
        </div>
        ${invoice.taxPercentage > 0 ? `
        <div class="fin-row">
          <span>Tax (${invoice.taxPercentage}%)</span>
          <span>${invoice.currency} ${(invoice.taxAmount / 100).toFixed(2)}</span>
        </div>
        ` : ''}
        ${invoice.discountAmount > 0 ? `
        <div class="fin-row">
          <span>Discount</span>
          <span style="color: #ef4444;">− ${invoice.currency} ${(invoice.discountAmount / 100).toFixed(2)}</span>
        </div>
        ` : ''}
        <div class="fin-row total">
          <span>Amount Due</span>
          <span>${invoice.currency} ${(invoice.total / 100).toFixed(2)}</span>
        </div>
      </div>
    </div>

    <div class="terms-section">
      ${invoice.paymentInstructions ? `
        <div class="terms-box">
          <h4>Payment Instructions</h4>
          <div>${invoice.paymentInstructions.replace(/\n/g, '<br/>')}</div>
        </div>
      ` : ''}
      
      ${invoice.termsAndConditions ? `
        <div class="terms-box">
          <h4>Terms of Engagement</h4>
          <div>${invoice.termsAndConditions.replace(/\n/g, '<br/>')}</div>
        </div>
      ` : ''}
    </div>

    <div class="footer">
      <div style="font-size: 11px; color: #64748b; max-width: 50%;">
        ${invoice.notes ? invoice.notes.replace(/\n/g, '<br/>') : 'Thank you for your business.'}
      </div>
      <div class="signature-area">
        ${generateSignatureBlock(invoice)}
      </div>
    </div>
  `;

  return generateBaseHtml(invoice, customStyles, contentBody);
}

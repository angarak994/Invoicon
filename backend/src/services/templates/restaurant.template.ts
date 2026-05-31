import { IInvoice } from '../../modules/invoices/invoice.model';
import { getFormattedDate, generateBaseHtml, getCustomField } from './base.template';

export function generateRestaurantTemplate(invoice: IInvoice): string {
  const formattedDate = getFormattedDate(invoice.invoiceDate);
  const brand = invoice.colorScheme || '#f97316'; // Orange default for food

  const itemsHtml = invoice.lineItems.map((item) => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px dashed #e5e7eb; font-size: 14px; color: #111827; font-weight: 500;">
        ${item.quantity}x ${item.description}
      </td>
      <td style="padding: 12px 16px; border-bottom: 1px dashed #e5e7eb; text-align: right; font-size: 14px; font-weight: 600; color: #111827;">
        ${invoice.currency} ${(item.amount / 100).toFixed(2)}
      </td>
    </tr>
  `).join('');

  const tableNumber = getCustomField(invoice, 'tableNumber');
  const orderType = getCustomField(invoice, 'orderType');

  const customStyles = `
    body { padding: 40px; font-family: 'Inter', sans-serif; background: #fafaf9; }
    .bill-card { background: white; max-width: 400px; margin: 0 auto; padding: 40px 30px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #f5f5f4; }
    
    .restaurant-header { text-align: center; margin-bottom: 30px; }
    .restaurant-logo { max-height: 80px; max-width: 160px; margin: 0 auto 16px; display: block; object-fit: contain; }
    .restaurant-name { font-size: 24px; font-weight: 800; color: ${brand}; letter-spacing: -0.5px; margin-bottom: 4px; text-transform: uppercase; }
    .restaurant-address { font-size: 12px; color: #57534e; line-height: 1.5; }
    
    .order-meta { text-align: center; border-top: 2px solid #f5f5f4; border-bottom: 2px solid #f5f5f4; padding: 16px 0; margin-bottom: 24px; }
    .order-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 13px; color: #44403c; }
    .order-meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #a8a29e; letter-spacing: 0.1em; margin-bottom: 4px; }
    .order-meta-value { font-weight: 600; color: #1c1917; }
    
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    
    .totals-area { border-top: 2px solid #1c1917; padding-top: 16px; margin-bottom: 30px; }
    .totals-row { display: flex; justify-content: space-between; font-size: 14px; color: #57534e; margin-bottom: 8px; }
    .totals-row.final { font-size: 20px; font-weight: 800; color: ${brand}; margin-top: 12px; padding-top: 12px; border-top: 1px dashed #d6d3d1; }
    
    .restaurant-footer { text-align: center; }
    .thank-you { font-family: 'Dancing Script', cursive; font-size: 28px; color: ${brand}; margin-bottom: 8px; }
    .footer-notes { font-size: 11px; color: #78716c; line-height: 1.5; }
  `;

  
  let customFieldsHtml = '';
  if (invoice.customFields) {
    const fields = invoice.customFields instanceof Map ? Object.fromEntries(invoice.customFields) : invoice.customFields;
    for (const [key, value] of Object.entries(fields)) {
      if (['tableNumber', 'orderType'].includes(key)) continue;
      customFieldsHtml += `
          <div>
            <div class="order-meta-label">${key}</div>
            <div class="order-meta-value">${value}</div>
          </div>`;
    }
  }

  const contentBody = `
    <div class="bill-card">
      <div class="restaurant-header">
        ${invoice.logoUrl 
          ? `<img src="${invoice.logoUrl}" class="restaurant-logo" />` 
          : `<div class="restaurant-name">${invoice.fromName}</div>`
        }
        <div class="restaurant-address">
          ${invoice.fromAddress ? invoice.fromAddress.replace(/\n/g, '<br/>') : ''}
          ${invoice.fromEmail ? `<br/>${invoice.fromEmail}` : ''}
        </div>
      </div>

      <div class="order-meta">
        <div class="order-meta-grid">
          <div>
            <div class="order-meta-label">Date</div>
            <div class="order-meta-value">${formattedDate}</div>
          </div>
          <div>
            <div class="order-meta-label">Order #</div>
            <div class="order-meta-value">${invoice.invoiceNumber}</div>
          </div>
          ${tableNumber ? `
          <div>
            <div class="order-meta-label">Table</div>
            <div class="order-meta-value">${tableNumber}</div>
          </div>` : ''}
          ${orderType ? `
          <div>
            <div class="order-meta-label">Type</div>
            <div class="order-meta-value">${orderType}</div>
          </div>` : ''}
          ${customFieldsHtml}
        </div>
      </div>
      
      ${invoice.toName ? `
      <div style="text-align: center; margin-bottom: 24px; font-size: 13px; color: #44403c;">
        <div class="order-meta-label">Customer</div>
        <div style="font-weight: 600;">${invoice.toName}</div>
      </div>
      ` : ''}

      <table>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="totals-area">
        <div class="totals-row">
          <span>Subtotal</span>
          <span>${invoice.currency} ${(invoice.subtotal / 100).toFixed(2)}</span>
        </div>
        ${invoice.taxPercentage > 0 ? `
        <div class="totals-row">
          <span>Tax (${invoice.taxPercentage}%)</span>
          <span>${invoice.currency} ${(invoice.taxAmount / 100).toFixed(2)}</span>
        </div>` : ''}
        ${invoice.discountAmount > 0 ? `
        <div class="totals-row">
          <span>Discount</span>
          <span style="color: #ef4444;">− ${invoice.currency} ${(invoice.discountAmount / 100).toFixed(2)}</span>
        </div>` : ''}
        <div class="totals-row final">
          <span>Total</span>
          <span>${invoice.currency} ${(invoice.total / 100).toFixed(2)}</span>
        </div>
      </div>

      <div class="restaurant-footer">
        <div class="thank-you">Thank You!</div>
        <div class="footer-notes">
          ${invoice.notes ? invoice.notes.replace(/\n/g, '<br/>') : 'Please come again.'}
        </div>
        ${invoice.paymentInstructions ? `
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed #e7e5e4; font-size: 11px; color: #57534e; text-align: left;">
          <strong style="display:block;margin-bottom:4px;color:#44403c;text-transform:uppercase;font-size:10px;letter-spacing:1px;">Payment Instructions</strong>
          ${invoice.paymentInstructions.replace(/\n/g, '<br/>')}
        </div>
        ` : ''}
        ${invoice.termsAndConditions ? `
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed #e7e5e4; font-size: 11px; color: #57534e; text-align: left;">
          <strong style="display:block;margin-bottom:4px;color:#44403c;text-transform:uppercase;font-size:10px;letter-spacing:1px;">Terms & Conditions</strong>
          ${invoice.termsAndConditions.replace(/\n/g, '<br/>')}
        </div>
        ` : ''}
      </div>
    </div>
  `;

  return generateBaseHtml(invoice, customStyles, contentBody);
}

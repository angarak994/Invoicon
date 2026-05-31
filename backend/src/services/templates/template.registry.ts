import { IInvoice } from '../../modules/invoices/invoice.model';
import { generateStandardTemplate } from './standard.template';
import { generateRetailTemplate } from './retail.template';
import { generateRestaurantTemplate } from './restaurant.template';
import { generateRentalTemplate } from './rental.template';
import { generateConstructionTemplate } from './construction.template';
import { generateProfessionalTemplate } from './professional.template';
import { generateCreativeTemplate } from './creative.template';
import { generateStartupTemplate } from './startup.template';
import { generateElegantTemplate } from './elegant.template';

export function getTemplateHtml(invoice: IInvoice): string {
  switch (invoice.templateId) {
    case 'standard':
      return generateStandardTemplate(invoice);
    case 'retail':
      return generateRetailTemplate(invoice);
    case 'restaurant':
      return generateRestaurantTemplate(invoice);
    case 'rental':
      return generateRentalTemplate(invoice);
    case 'construction':
      return generateConstructionTemplate(invoice);
    case 'professional':
      return generateProfessionalTemplate(invoice);
    case 'creative':
      return generateCreativeTemplate(invoice);
    case 'startup':
      return generateStartupTemplate(invoice);
    case 'elegant':
      return generateElegantTemplate(invoice);
    default:
      return generateStandardTemplate(invoice);
  }
}

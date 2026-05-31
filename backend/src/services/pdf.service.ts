import puppeteer from 'puppeteer';
import { IInvoice } from '../modules/invoices/invoice.model';
import { env } from '../config/env';
import { getTemplateHtml } from './templates/template.registry';

export async function generateInvoicePDF(invoice: IInvoice): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    const htmlContent = getTemplateHtml(invoice);

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' as any });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' }
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

import { Router } from 'express';
import * as invoiceController from './invoice.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { validate } from '../../middleware/validate';
import * as invoiceSchemas from './invoice.schema';

const router = Router();

router.use(requireAuth);

// Trash-Specific Operations (Must be loaded before ID parameter matches to prevent route overlaps)
router.get('/trash', invoiceController.listTrash);
router.post('/trash/:id/restore', invoiceController.restoreInvoice);
router.delete('/trash/:id/permanent', invoiceController.permanentDeleteInvoice);

// Standard CRUD Operations
router.post('/preview', validate(invoiceSchemas.createInvoiceSchema), invoiceController.previewInvoiceHtml);
router.post('/', validate(invoiceSchemas.createInvoiceSchema), invoiceController.createInvoice);
router.get('/', invoiceController.listInvoices);
router.get('/:id', invoiceController.getInvoice);
router.get('/:id/download', invoiceController.downloadInvoice);
router.patch('/:id', validate(invoiceSchemas.updateInvoiceSchema), invoiceController.updateInvoice);
router.patch('/:id/status', validate(invoiceSchemas.updateStatusSchema), invoiceController.updateInvoiceStatus);
router.delete('/:id', invoiceController.deleteInvoice);

export default router;

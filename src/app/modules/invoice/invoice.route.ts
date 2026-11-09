import { UserRole } from '@prisma/client';
import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { InvoiceController } from './invoice.controller';
import { InvoiceValidation } from './invoice.validation';

const router = Router();

router.post(
  '/generate',
  auth(UserRole.ADMIN),
  validateRequest(InvoiceValidation.generateInvoiceValidationSchema),
  InvoiceController.generateInvoice,
);

router.get('/', auth(), InvoiceController.getAllInvoices);

router.get('/:id', auth(), InvoiceController.getInvoiceById);

export const InvoiceRoutes = router;

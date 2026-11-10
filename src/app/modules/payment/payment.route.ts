import { UserRole } from '@prisma/client';
import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { PaymentController } from './payment.controller';
import { PaymentValidation } from './payment.validation';

const router = Router();

router.post(
  '/initiate',
  auth(UserRole.CUSTOMER),
  validateRequest(PaymentValidation.initiatePaymentValidationSchema),
  PaymentController.initiatePayment,
);

// SSLCommerz callback endpoints (accessed via POST by gateway redirect)
router.post('/ssl/success', PaymentController.handleSuccess);
router.post('/ssl/fail', PaymentController.handleFail);
router.post('/ssl/cancel', PaymentController.handleCancel);
router.post('/ssl/ipn', PaymentController.handleIpn);

router.get('/my-history', auth(), PaymentController.getMyPayments);

export const PaymentRoutes = router;

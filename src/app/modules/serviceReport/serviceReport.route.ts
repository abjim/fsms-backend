import { UserRole } from '@prisma/client';
import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ServiceReportController } from './serviceReport.controller';
import { ServiceReportValidation } from './serviceReport.validation';

const router = Router();

router.post(
  '/',
  auth(UserRole.TECHNICIAN),
  validateRequest(ServiceReportValidation.submitServiceReportValidationSchema),
  ServiceReportController.submitServiceReport,
);

router.get(
  '/work-order/:workOrderId',
  auth(),
  ServiceReportController.getReportByWorkOrderId,
);

export const ServiceReportRoutes = router;

import { UserRole } from '@prisma/client';
import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ServiceRequestController } from './serviceRequest.controller';
import { ServiceRequestValidation } from './serviceRequest.validation';

const router = Router();

router.post(
  '/',
  auth(UserRole.CUSTOMER),
  validateRequest(ServiceRequestValidation.createServiceRequestValidationSchema),
  ServiceRequestController.createServiceRequest,
);

router.get(
  '/',
  auth(UserRole.CUSTOMER, UserRole.ADMIN),
  ServiceRequestController.getAllServiceRequests,
);

router.get(
  '/:id',
  auth(UserRole.CUSTOMER, UserRole.ADMIN),
  ServiceRequestController.getServiceRequestById,
);

router.patch(
  '/:id',
  auth(UserRole.CUSTOMER, UserRole.ADMIN),
  validateRequest(ServiceRequestValidation.updateServiceRequestValidationSchema),
  ServiceRequestController.updateServiceRequest,
);

router.post(
  '/:id/cancel',
  auth(UserRole.CUSTOMER, UserRole.ADMIN),
  ServiceRequestController.cancelServiceRequest,
);

export const ServiceRequestRoutes = router;

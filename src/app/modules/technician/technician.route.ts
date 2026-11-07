import { UserRole } from '@prisma/client';
import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { TechnicianController } from './technician.controller';
import { TechnicianValidation } from './technician.validation';

const router = Router();

router.get('/', TechnicianController.getAllTechnicians);
router.get('/:id', TechnicianController.getTechnicianById);

router.put(
  '/availability',
  auth(UserRole.TECHNICIAN),
  validateRequest(TechnicianValidation.updateAvailabilityValidationSchema),
  TechnicianController.updateAvailability,
);

router.patch(
  '/status',
  auth(UserRole.TECHNICIAN),
  validateRequest(TechnicianValidation.updateStatusValidationSchema),
  TechnicianController.updateAvailabilityStatus,
);

export const TechnicianRoutes = router;

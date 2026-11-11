import { UserRole } from '@prisma/client';
import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { AdminController } from './admin.controller';
import { AdminValidation } from './admin.validation';

const router = Router();

router.get('/dashboard-stats', auth(UserRole.ADMIN), AdminController.getDashboardStats);

router.get('/audit-logs', auth(UserRole.ADMIN), AdminController.getAuditLogs);

router.patch(
  '/users/:id/status',
  auth(UserRole.ADMIN),
  validateRequest(AdminValidation.updateUserStatusValidationSchema),
  AdminController.updateUserStatus,
);

export const AdminRoutes = router;

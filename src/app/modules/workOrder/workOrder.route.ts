import { UserRole } from '@prisma/client';
import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { WorkOrderController } from './workOrder.controller';
import { WorkOrderValidation } from './workOrder.validation';

const router = Router();

router.post(
  '/assign',
  auth(UserRole.ADMIN),
  validateRequest(WorkOrderValidation.assignWorkOrderValidationSchema),
  WorkOrderController.assignWorkOrder,
);

router.get('/', auth(), WorkOrderController.getAllWorkOrders);

router.get('/:id', auth(), WorkOrderController.getWorkOrderById);

router.patch(
  '/:id/status',
  auth(UserRole.TECHNICIAN, UserRole.ADMIN),
  validateRequest(WorkOrderValidation.updateWorkOrderStatusValidationSchema),
  WorkOrderController.updateWorkOrderStatus,
);

export const WorkOrderRoutes = router;

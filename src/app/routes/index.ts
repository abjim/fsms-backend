import { Router } from 'express';
import { AuthRoutes } from '../modules/auth/auth.route';
import { CategoryRoutes } from '../modules/category/category.route';
import { InvoiceRoutes } from '../modules/invoice/invoice.route';
import { PaymentRoutes } from '../modules/payment/payment.route';
import { ServiceReportRoutes } from '../modules/serviceReport/serviceReport.route';
import { ServiceRequestRoutes } from '../modules/serviceRequest/serviceRequest.route';
import { TechnicianRoutes } from '../modules/technician/technician.route';
import { UserRoutes } from '../modules/user/user.route';
import { WorkOrderRoutes } from '../modules/workOrder/workOrder.route';

const router = Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/users',
    route: UserRoutes,
  },
  {
    path: '/categories',
    route: CategoryRoutes,
  },
  {
    path: '/technicians',
    route: TechnicianRoutes,
  },
  {
    path: '/service-requests',
    route: ServiceRequestRoutes,
  },
  {
    path: '/work-orders',
    route: WorkOrderRoutes,
  },
  {
    path: '/service-reports',
    route: ServiceReportRoutes,
  },
  {
    path: '/invoices',
    route: InvoiceRoutes,
  },
  {
    path: '/payments',
    route: PaymentRoutes,
  },
];

moduleRoutes.forEach((item) => router.use(item.path, item.route));

export default router;

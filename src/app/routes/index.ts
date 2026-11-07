import { Router } from 'express';
import { AuthRoutes } from '../modules/auth/auth.route';
import { CategoryRoutes } from '../modules/category/category.route';
import { TechnicianRoutes } from '../modules/technician/technician.route';
import { UserRoutes } from '../modules/user/user.route';

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
];

moduleRoutes.forEach((item) => router.use(item.path, item.route));

export default router;

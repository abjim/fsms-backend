import { UserRole } from '@prisma/client';
import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ReviewController } from './review.controller';
import { ReviewValidation } from './review.validation';

const router = Router();

router.post(
  '/',
  auth(UserRole.CUSTOMER),
  validateRequest(ReviewValidation.createReviewValidationSchema),
  ReviewController.createReview,
);

router.get('/technician/:technicianId', ReviewController.getTechnicianReviews);

export const ReviewRoutes = router;

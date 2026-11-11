import { z } from 'zod';

const createReviewValidationSchema = z.object({
  workOrderId: z.string({ required_error: 'Work order ID is required' }),
  rating: z.number({ required_error: 'Rating is required' }).min(1).max(5),
  comment: z.string().optional(),
});

export const ReviewValidation = {
  createReviewValidationSchema,
};

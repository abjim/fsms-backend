import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import pick from '../../utils/pick';
import sendResponse from '../../utils/sendResponse';
import { ReviewService } from './review.service';

const createReview = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.createReview(req.user, req.body);

  sendResponse(res, {
    statusCode: 201,
    message: 'Review submitted successfully',
    data: result,
  });
});

const getTechnicianReviews = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
  const result = await ReviewService.getTechnicianReviews(
    req.params.technicianId,
    options,
  );

  sendResponse(res, {
    statusCode: 200,
    message: 'Reviews retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const ReviewController = {
  createReview,
  getTechnicianReviews,
};

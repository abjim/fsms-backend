import { WorkOrderStatus } from '@prisma/client';
import AppError from '../../errors/AppError';
import { TAuthUser } from '../../interface/common';
import prisma from '../../shared/prisma';
import calculatePagination from '../../utils/calculatePagination';

const createReview = async (
  user: TAuthUser,
  payload: { workOrderId: string; rating: number; comment?: string },
) => {
  const workOrder = await prisma.workOrder.findUnique({
    where: { id: payload.workOrderId },
    include: {
      serviceRequest: true,
      review: true,
    },
  });

  if (!workOrder) {
    throw new AppError(404, 'Work order not found');
  }

  if (workOrder.serviceRequest.customerId !== user.userId) {
    throw new AppError(403, 'You can only review your own service orders');
  }

  if (workOrder.status !== WorkOrderStatus.COMPLETED) {
    throw new AppError(400, 'Review can only be provided for completed work orders');
  }

  if (workOrder.review) {
    throw new AppError(400, 'Review already submitted for this work order');
  }

  const result = await prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        workOrderId: payload.workOrderId,
        customerId: user.userId,
        technicianId: workOrder.technicianId,
        rating: payload.rating,
        comment: payload.comment,
      },
    });

    // recalculate technician average rating
    const techReviews = await tx.review.findMany({
      where: { technicianId: workOrder.technicianId },
      select: { rating: true },
    });

    const totalReviews = techReviews.length;
    const avgRating =
      techReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

    await tx.technicianProfile.update({
      where: { id: workOrder.technicianId },
      data: {
        totalReviews,
        avgRating: Number(avgRating.toFixed(1)),
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.userId,
        action: 'REVIEW_SUBMITTED',
        entity: 'Review',
        entityId: review.id,
        details: JSON.stringify({ rating: payload.rating, technicianId: workOrder.technicianId }),
      },
    });

    return review;
  });

  return result;
};

const getTechnicianReviews = async (technicianId: string, options: any) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);

  const [result, total] = await Promise.all([
    prisma.review.findMany({
      where: { technicianId },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        customer: { select: { id: true, name: true } },
      },
    }),
    prisma.review.count({ where: { technicianId } }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: result,
  };
};

export const ReviewService = {
  createReview,
  getTechnicianReviews,
};

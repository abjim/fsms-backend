import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import pick from '../../utils/pick';
import sendResponse from '../../utils/sendResponse';
import { TechnicianService } from './technician.service';

const getAllTechnicians = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ['searchTerm', 'city', 'skill', 'isAvailable']);
  const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

  const result = await TechnicianService.getAllTechnicians(filters, options);

  sendResponse(res, {
    statusCode: 200,
    message: 'Technicians retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getTechnicianById = catchAsync(async (req: Request, res: Response) => {
  const result = await TechnicianService.getTechnicianById(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    message: 'Technician retrieved successfully',
    data: result,
  });
});

const updateAvailability = catchAsync(async (req: Request, res: Response) => {
  const result = await TechnicianService.updateAvailability(
    req.user.userId,
    req.body.slots,
  );

  sendResponse(res, {
    statusCode: 200,
    message: 'Availability slots updated successfully',
    data: result,
  });
});

const updateAvailabilityStatus = catchAsync(
  async (req: Request, res: Response) => {
    const result = await TechnicianService.updateAvailabilityStatus(
      req.user.userId,
      req.body.isAvailable,
    );

    sendResponse(res, {
      statusCode: 200,
      message: 'Technician status updated successfully',
      data: result,
    });
  },
);

export const TechnicianController = {
  getAllTechnicians,
  getTechnicianById,
  updateAvailability,
  updateAvailabilityStatus,
};

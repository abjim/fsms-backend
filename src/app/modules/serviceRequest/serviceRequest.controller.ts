import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import pick from '../../utils/pick';
import sendResponse from '../../utils/sendResponse';
import { ServiceRequestService } from './serviceRequest.service';

const createServiceRequest = catchAsync(async (req: Request, res: Response) => {
  const result = await ServiceRequestService.createServiceRequest(
    req.user.userId,
    req.body,
  );

  sendResponse(res, {
    statusCode: 201,
    message: 'Service request submitted successfully',
    data: result,
  });
});

const getAllServiceRequests = catchAsync(
  async (req: Request, res: Response) => {
    const filters = pick(req.query, [
      'searchTerm',
      'status',
      'priority',
      'categoryId',
      'city',
    ]);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

    const result = await ServiceRequestService.getAllServiceRequests(
      req.user,
      filters,
      options,
    );

    sendResponse(res, {
      statusCode: 200,
      message: 'Service requests retrieved successfully',
      meta: result.meta,
      data: result.data,
    });
  },
);

const getServiceRequestById = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ServiceRequestService.getServiceRequestById(
      req.params.id,
      req.user,
    );

    sendResponse(res, {
      statusCode: 200,
      message: 'Service request details retrieved successfully',
      data: result,
    });
  },
);

const updateServiceRequest = catchAsync(async (req: Request, res: Response) => {
  const result = await ServiceRequestService.updateServiceRequest(
    req.params.id,
    req.user,
    req.body,
  );

  sendResponse(res, {
    statusCode: 200,
    message: 'Service request updated successfully',
    data: result,
  });
});

const cancelServiceRequest = catchAsync(async (req: Request, res: Response) => {
  const result = await ServiceRequestService.cancelServiceRequest(
    req.params.id,
    req.user,
  );

  sendResponse(res, {
    statusCode: 200,
    message: 'Service request cancelled successfully',
    data: result,
  });
});

export const ServiceRequestController = {
  createServiceRequest,
  getAllServiceRequests,
  getServiceRequestById,
  updateServiceRequest,
  cancelServiceRequest,
};

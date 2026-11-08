import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import pick from '../../utils/pick';
import sendResponse from '../../utils/sendResponse';
import { WorkOrderService } from './workOrder.service';

const assignWorkOrder = catchAsync(async (req: Request, res: Response) => {
  const result = await WorkOrderService.assignWorkOrder(
    req.user.userId,
    req.body,
  );

  sendResponse(res, {
    statusCode: 201,
    message: 'Technician assigned and work order created successfully',
    data: result,
  });
});

const getAllWorkOrders = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ['status', 'scheduledDate', 'technicianId']);
  const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

  const result = await WorkOrderService.getAllWorkOrders(
    req.user,
    filters,
    options,
  );

  sendResponse(res, {
    statusCode: 200,
    message: 'Work orders retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getWorkOrderById = catchAsync(async (req: Request, res: Response) => {
  const result = await WorkOrderService.getWorkOrderById(
    req.params.id,
    req.user,
  );

  sendResponse(res, {
    statusCode: 200,
    message: 'Work order details retrieved successfully',
    data: result,
  });
});

const updateWorkOrderStatus = catchAsync(
  async (req: Request, res: Response) => {
    const result = await WorkOrderService.updateWorkOrderStatus(
      req.params.id,
      req.user,
      req.body,
    );

    sendResponse(res, {
      statusCode: 200,
      message: 'Work order status updated successfully',
      data: result,
    });
  },
);

export const WorkOrderController = {
  assignWorkOrder,
  getAllWorkOrders,
  getWorkOrderById,
  updateWorkOrderStatus,
};

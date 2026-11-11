import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import pick from '../../utils/pick';
import sendResponse from '../../utils/sendResponse';
import { AdminService } from './admin.service';

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getDashboardStats();

  sendResponse(res, {
    statusCode: 200,
    message: 'Dashboard statistics retrieved successfully',
    data: result,
  });
});

const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ['action', 'entity', 'userId']);
  const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

  const result = await AdminService.getAuditLogs(filters, options);

  sendResponse(res, {
    statusCode: 200,
    message: 'Audit logs retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.updateUserStatus(
    req.user.userId,
    req.params.id,
    req.body.status,
  );

  sendResponse(res, {
    statusCode: 200,
    message: 'User status updated successfully',
    data: result,
  });
});

export const AdminController = {
  getDashboardStats,
  getAuditLogs,
  updateUserStatus,
};

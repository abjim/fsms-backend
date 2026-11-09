import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ServiceReportService } from './serviceReport.service';

const submitServiceReport = catchAsync(async (req: Request, res: Response) => {
  const result = await ServiceReportService.submitServiceReport(
    req.user,
    req.body,
  );

  sendResponse(res, {
    statusCode: 201,
    message: 'Service report submitted successfully',
    data: result,
  });
});

const getReportByWorkOrderId = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ServiceReportService.getReportByWorkOrderId(
      req.params.workOrderId,
      req.user,
    );

    sendResponse(res, {
      statusCode: 200,
      message: 'Service report retrieved successfully',
      data: result,
    });
  },
);

export const ServiceReportController = {
  submitServiceReport,
  getReportByWorkOrderId,
};

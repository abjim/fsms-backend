import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import pick from '../../utils/pick';
import sendResponse from '../../utils/sendResponse';
import { PaymentService } from './payment.service';

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.initiatePayment(
    req.user.userId,
    req.body.invoiceId,
  );

  sendResponse(res, {
    statusCode: 200,
    message: 'Payment session initiated successfully',
    data: result,
  });
});

const handleSuccess = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.handleSuccessCallback(req.body);

  sendResponse(res, {
    statusCode: 200,
    message: 'Payment verified and completed successfully',
    data: result,
  });
});

const handleFail = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.handleFailCallback(req.body);

  sendResponse(res, {
    statusCode: 200,
    message: 'Payment marked as failed',
    data: result,
  });
});

const handleCancel = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.handleCancelCallback(req.body);

  sendResponse(res, {
    statusCode: 200,
    message: 'Payment cancelled',
    data: result,
  });
});

const handleIpn = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.handleSuccessCallback(req.body);

  sendResponse(res, {
    statusCode: 200,
    message: 'IPN processed successfully',
    data: result,
  });
});

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
  const result = await PaymentService.getMyPayments(req.user, options);

  sendResponse(res, {
    statusCode: 200,
    message: 'Payment history retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const PaymentController = {
  initiatePayment,
  handleSuccess,
  handleFail,
  handleCancel,
  handleIpn,
  getMyPayments,
};

import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import pick from '../../utils/pick';
import sendResponse from '../../utils/sendResponse';
import { InvoiceService } from './invoice.service';

const generateInvoice = catchAsync(async (req: Request, res: Response) => {
  const result = await InvoiceService.generateInvoice(
    req.user.userId,
    req.body,
  );

  sendResponse(res, {
    statusCode: 201,
    message: 'Invoice generated successfully',
    data: result,
  });
});

const getAllInvoices = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ['status', 'searchTerm']);
  const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

  const result = await InvoiceService.getAllInvoices(
    req.user,
    filters,
    options,
  );

  sendResponse(res, {
    statusCode: 200,
    message: 'Invoices retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getInvoiceById = catchAsync(async (req: Request, res: Response) => {
  const result = await InvoiceService.getInvoiceById(req.params.id, req.user);

  sendResponse(res, {
    statusCode: 200,
    message: 'Invoice retrieved successfully',
    data: result,
  });
});

export const InvoiceController = {
  generateInvoice,
  getAllInvoices,
  getInvoiceById,
};

import { InvoiceStatus, Prisma, UserRole, WorkOrderStatus } from '@prisma/client';
import crypto from 'crypto';
import AppError from '../../errors/AppError';
import { TAuthUser } from '../../interface/common';
import prisma from '../../shared/prisma';
import calculatePagination from '../../utils/calculatePagination';

const generateInvoice = async (
  adminId: string,
  payload: {
    workOrderId: string;
    laborCost: number;
    partsCost?: number;
    tax?: number;
  },
) => {
  const workOrder = await prisma.workOrder.findUnique({
    where: { id: payload.workOrderId },
    include: {
      serviceRequest: true,
      invoice: true,
    },
  });

  if (!workOrder) {
    throw new AppError(404, 'Work order not found');
  }

  if (workOrder.status !== WorkOrderStatus.COMPLETED) {
    throw new AppError(400, 'Invoice can only be generated for completed work orders');
  }

  if (workOrder.invoice) {
    throw new AppError(400, 'Invoice already generated for this work order');
  }

  const laborCost = payload.laborCost;
  const partsCost = payload.partsCost || 0;
  const tax = payload.tax || 0;
  const totalAmount = laborCost + partsCost + tax;

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
  const invoiceNumber = `INV-${dateStr}-${randomHex}`;

  const result = await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.create({
      data: {
        workOrderId: payload.workOrderId,
        customerId: workOrder.serviceRequest.customerId,
        invoiceNumber,
        laborCost,
        partsCost,
        tax,
        totalAmount,
        status: InvoiceStatus.ISSUED,
      },
      include: {
        workOrder: {
          include: {
            serviceRequest: true,
            technician: {
              include: { user: { select: { id: true, name: true, phone: true } } },
            },
          },
        },
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    await tx.auditLog.create({
      data: {
        userId: adminId,
        action: 'INVOICE_GENERATED',
        entity: 'Invoice',
        entityId: invoice.id,
        details: JSON.stringify({
          invoiceNumber,
          totalAmount,
          workOrderId: payload.workOrderId,
        }),
      },
    });

    return invoice;
  });

  return result;
};

const getAllInvoices = async (
  user: TAuthUser,
  params: any,
  options: any,
) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);
  const { status, searchTerm } = params;

  const andConditions: Prisma.InvoiceWhereInput[] = [{ deletedAt: null }];

  if (user.role === UserRole.CUSTOMER) {
    andConditions.push({ customerId: user.userId });
  }

  if (status) {
    andConditions.push({ status });
  }

  if (searchTerm) {
    andConditions.push({
      invoiceNumber: { contains: searchTerm, mode: 'insensitive' },
    });
  }

  const whereConditions: Prisma.InvoiceWhereInput = { AND: andConditions };

  const [result, total] = await Promise.all([
    prisma.invoice.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        workOrder: {
          include: {
            serviceRequest: { select: { id: true, title: true } },
          },
        },
        payments: true,
      },
    }),
    prisma.invoice.count({ where: whereConditions }),
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

const getInvoiceById = async (id: string, user: TAuthUser) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id, deletedAt: null },
    include: {
      customer: {
        select: { id: true, name: true, email: true, phone: true, address: true },
      },
      workOrder: {
        include: {
          serviceRequest: true,
          technician: {
            include: { user: { select: { id: true, name: true, phone: true } } },
          },
          serviceReport: true,
        },
      },
      payments: true,
    },
  });

  if (!invoice) {
    throw new AppError(404, 'Invoice not found');
  }

  if (user.role === UserRole.CUSTOMER && invoice.customerId !== user.userId) {
    throw new AppError(403, 'You do not have permission to view this invoice');
  }

  return invoice;
};

export const InvoiceService = {
  generateInvoice,
  getAllInvoices,
  getInvoiceById,
};

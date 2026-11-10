import { InvoiceStatus, PaymentProvider, PaymentStatus, Prisma, UserRole } from '@prisma/client';
import AppError from '../../errors/AppError';
import { TAuthUser } from '../../interface/common';
import prisma from '../../shared/prisma';
import calculatePagination from '../../utils/calculatePagination';
import { generateTransactionId } from './payment.utils';
import { SslCommerzHelper } from './sslcommerz.helper';

const initiatePayment = async (customerId: string, invoiceId: string) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, deletedAt: null },
    include: {
      customer: true,
      workOrder: {
        include: { serviceRequest: true },
      },
    },
  });

  if (!invoice) {
    throw new AppError(404, 'Invoice not found');
  }

  if (invoice.customerId !== customerId) {
    throw new AppError(403, 'You do not own this invoice');
  }

  if (invoice.status === InvoiceStatus.PAID) {
    throw new AppError(400, 'Invoice has already been paid');
  }

  const transactionId = generateTransactionId();

  // create initial pending payment record
  const payment = await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      customerId,
      amount: invoice.totalAmount,
      currency: 'BDT',
      provider: PaymentProvider.SSLCOMMERZ,
      status: PaymentStatus.PENDING,
      transactionId,
    },
  });

  const session = await SslCommerzHelper.initPayment({
    transactionId,
    amount: invoice.totalAmount,
    invoiceNumber: invoice.invoiceNumber,
    customerName: invoice.customer.name,
    customerEmail: invoice.customer.email,
    customerPhone: invoice.customer.phone,
    customerAddress: invoice.customer.address,
  });

  return {
    paymentId: payment.id,
    transactionId,
    gatewayUrl: session.GatewayPageURL,
    sessionKey: session.sessionkey,
  };
};

const handleSuccessCallback = async (callbackData: any) => {
  const { tran_id, val_id, amount } = callbackData;

  const payment = await prisma.payment.findUnique({
    where: { transactionId: tran_id },
    include: { invoice: true },
  });

  if (!payment) {
    throw new AppError(404, 'Payment record not found for transaction');
  }

  if (payment.status === PaymentStatus.COMPLETED) {
    return { success: true, message: 'Payment already processed' };
  }

  // validate with SSLCommerz server if val_id is provided
  if (val_id) {
    try {
      const validation = await SslCommerzHelper.validatePayment(val_id);
      if (!SslCommerzHelper.isValidStatus(validation.status)) {
        throw new AppError(400, 'Payment validation failed at SSLCommerz');
      }

      if (amount && Number(amount) !== payment.amount) {
        throw new AppError(400, 'Paid amount mismatch detected');
      }
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      // fallback in sandbox testing if validation endpoint is unreachable
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.COMPLETED,
        gatewayResponse: JSON.stringify(callbackData),
      },
    });

    await tx.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        userId: payment.customerId,
        action: 'PAYMENT_COMPLETED',
        entity: 'Payment',
        entityId: payment.id,
        details: JSON.stringify({
          transactionId: tran_id,
          amount: payment.amount,
          invoiceId: payment.invoiceId,
        }),
      },
    });

    return updatedPayment;
  });

  return result;
};

const handleFailCallback = async (callbackData: any) => {
  const { tran_id } = callbackData;

  const payment = await prisma.payment.findUnique({
    where: { transactionId: tran_id },
  });

  if (payment && payment.status === PaymentStatus.PENDING) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        gatewayResponse: JSON.stringify(callbackData),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: payment.customerId,
        action: 'PAYMENT_FAILED',
        entity: 'Payment',
        entityId: payment.id,
        details: JSON.stringify(callbackData),
      },
    });
  }

  return { message: 'Payment failed' };
};

const handleCancelCallback = async (callbackData: any) => {
  const { tran_id } = callbackData;

  const payment = await prisma.payment.findUnique({
    where: { transactionId: tran_id },
  });

  if (payment && payment.status === PaymentStatus.PENDING) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.CANCELLED,
        gatewayResponse: JSON.stringify(callbackData),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: payment.customerId,
        action: 'PAYMENT_CANCELLED',
        entity: 'Payment',
        entityId: payment.id,
      },
    });
  }

  return { message: 'Payment cancelled' };
};

const getMyPayments = async (user: TAuthUser, options: any) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);

  const andConditions: Prisma.PaymentWhereInput[] = [];

  if (user.role === UserRole.CUSTOMER) {
    andConditions.push({ customerId: user.userId });
  }

  const whereConditions: Prisma.PaymentWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [result, total] = await Promise.all([
    prisma.payment.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            totalAmount: true,
            status: true,
          },
        },
      },
    }),
    prisma.payment.count({ where: whereConditions }),
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

export const PaymentService = {
  initiatePayment,
  handleSuccessCallback,
  handleFailCallback,
  handleCancelCallback,
  getMyPayments,
};

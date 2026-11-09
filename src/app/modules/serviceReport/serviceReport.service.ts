import { WorkOrderStatus } from '@prisma/client';
import AppError from '../../errors/AppError';
import { TAuthUser } from '../../interface/common';
import prisma from '../../shared/prisma';

const submitServiceReport = async (
  user: TAuthUser,
  payload: {
    workOrderId: string;
    problemFound: string;
    workSummary: string;
    partsUsed?: string;
    laborHours: number;
    customerSignatureUrl?: string;
  },
) => {
  const workOrder = await prisma.workOrder.findUnique({
    where: { id: payload.workOrderId },
    include: {
      technician: true,
      serviceReport: true,
    },
  });

  if (!workOrder) {
    throw new AppError(404, 'Work order not found');
  }

  if (workOrder.technician.userId !== user.userId) {
    throw new AppError(403, 'You are not assigned to this work order');
  }

  if (workOrder.serviceReport) {
    throw new AppError(400, 'Service report already submitted for this work order');
  }

  const result = await prisma.$transaction(async (tx) => {
    const report = await tx.serviceReport.create({
      data: {
        workOrderId: payload.workOrderId,
        technicianId: workOrder.technicianId,
        problemFound: payload.problemFound,
        workSummary: payload.workSummary,
        partsUsed: payload.partsUsed,
        laborHours: payload.laborHours,
        customerSignatureUrl: payload.customerSignatureUrl,
      },
    });

    if (workOrder.status !== WorkOrderStatus.COMPLETED) {
      await tx.workOrder.update({
        where: { id: payload.workOrderId },
        data: {
          status: WorkOrderStatus.COMPLETED,
          completedAt: new Date(),
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: user.userId,
        action: 'SERVICE_REPORT_SUBMITTED',
        entity: 'ServiceReport',
        entityId: report.id,
        details: JSON.stringify({ workOrderId: payload.workOrderId }),
      },
    });

    return report;
  });

  return result;
};

const getReportByWorkOrderId = async (
  workOrderId: string,
  user: TAuthUser,
) => {
  const report = await prisma.serviceReport.findUnique({
    where: { workOrderId },
    include: {
      workOrder: {
        include: {
          serviceRequest: true,
          technician: {
            include: { user: { select: { id: true, name: true, phone: true } } },
          },
        },
      },
    },
  });

  if (!report) {
    throw new AppError(404, 'Service report not found');
  }

  return report;
};

export const ServiceReportService = {
  submitServiceReport,
  getReportByWorkOrderId,
};

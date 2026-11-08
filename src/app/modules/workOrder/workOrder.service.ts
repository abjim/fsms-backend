import { Prisma, ServiceRequestStatus, UserRole, WorkOrderStatus } from '@prisma/client';
import AppError from '../../errors/AppError';
import { TAuthUser } from '../../interface/common';
import prisma from '../../shared/prisma';
import calculatePagination from '../../utils/calculatePagination';

const assignWorkOrder = async (
  adminId: string,
  payload: {
    serviceRequestId: string;
    technicianId: string;
    scheduledDate: string;
    startTime: string;
    endTime: string;
    adminNotes?: string;
  },
) => {
  const serviceRequest = await prisma.serviceRequest.findFirst({
    where: { id: payload.serviceRequestId, deletedAt: null },
    include: { workOrder: true },
  });

  if (!serviceRequest) {
    throw new AppError(404, 'Service request not found');
  }

  if (serviceRequest.workOrder) {
    throw new AppError(400, 'Service request is already assigned to a work order');
  }

  const technician = await prisma.technicianProfile.findUnique({
    where: { id: payload.technicianId },
    include: { availabilities: true },
  });

  if (!technician) {
    throw new AppError(404, 'Technician not found');
  }

  if (!technician.isAvailable) {
    throw new AppError(400, 'Technician is currently marked as unavailable');
  }

  const targetDate = new Date(payload.scheduledDate);
  const dayOfWeek = targetDate.getDay();

  // verify technician works on this day
  const matchingSlot = technician.availabilities.find(
    (slot) => slot.dayOfWeek === dayOfWeek,
  );

  if (!matchingSlot) {
    throw new AppError(
      400,
      'Technician does not work on this day of the week',
    );
  }

  // check if visit time falls within technician working hours
  if (
    payload.startTime < matchingSlot.startTime ||
    payload.endTime > matchingSlot.endTime
  ) {
    throw new AppError(
      400,
      `Scheduled time must be within technician working hours (${matchingSlot.startTime} to ${matchingSlot.endTime})`,
    );
  }

  // schedule conflict detection using Prisma transaction
  const startOfDay = new Date(targetDate);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const result = await prisma.$transaction(async (tx) => {
    const existingWorkOrders = await tx.workOrder.findMany({
      where: {
        technicianId: payload.technicianId,
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: [
            WorkOrderStatus.SCHEDULED,
            WorkOrderStatus.EN_ROUTE,
            WorkOrderStatus.IN_PROGRESS,
          ],
        },
      },
    });

    // check if times overlap
    const hasConflict = existingWorkOrders.some((order) => {
      return (
        payload.startTime < order.endTime && payload.endTime > order.startTime
      );
    });

    if (hasConflict) {
      throw new AppError(
        409,
        'Technician already has an active visit scheduled during this time slot',
      );
    }

    const createdWorkOrder = await tx.workOrder.create({
      data: {
        serviceRequestId: payload.serviceRequestId,
        technicianId: payload.technicianId,
        assignedById: adminId,
        scheduledDate: targetDate,
        startTime: payload.startTime,
        endTime: payload.endTime,
        adminNotes: payload.adminNotes,
        status: WorkOrderStatus.SCHEDULED,
      },
      include: {
        serviceRequest: true,
        technician: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    });

    await tx.serviceRequest.update({
      where: { id: payload.serviceRequestId },
      data: { status: ServiceRequestStatus.ASSIGNED },
    });

    await tx.auditLog.create({
      data: {
        userId: adminId,
        action: 'WORK_ORDER_ASSIGNED',
        entity: 'WorkOrder',
        entityId: createdWorkOrder.id,
        details: JSON.stringify({
          technicianId: payload.technicianId,
          scheduledDate: payload.scheduledDate,
          startTime: payload.startTime,
          endTime: payload.endTime,
        }),
      },
    });

    return createdWorkOrder;
  });

  return result;
};

const getAllWorkOrders = async (
  user: TAuthUser,
  params: any,
  options: any,
) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);
  const { status, scheduledDate, technicianId } = params;

  const andConditions: Prisma.WorkOrderWhereInput[] = [{ deletedAt: null }];

  if (user.role === UserRole.TECHNICIAN) {
    andConditions.push({ technician: { userId: user.userId } });
  } else if (user.role === UserRole.CUSTOMER) {
    andConditions.push({ serviceRequest: { customerId: user.userId } });
  }

  if (technicianId) {
    andConditions.push({ technicianId });
  }

  if (status) {
    andConditions.push({ status });
  }

  if (scheduledDate) {
    const date = new Date(scheduledDate);
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    andConditions.push({
      scheduledDate: { gte: startOfDay, lte: endOfDay },
    });
  }

  const whereConditions: Prisma.WorkOrderWhereInput = { AND: andConditions };

  const [result, total] = await Promise.all([
    prisma.workOrder.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        serviceRequest: {
          include: {
            customer: {
              select: { id: true, name: true, email: true, phone: true },
            },
            category: { select: { id: true, name: true } },
          },
        },
        technician: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
          },
        },
        serviceReport: true,
        invoice: { select: { id: true, invoiceNumber: true, status: true, totalAmount: true } },
      },
    }),
    prisma.workOrder.count({ where: whereConditions }),
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

const getWorkOrderById = async (id: string, user: TAuthUser) => {
  const workOrder = await prisma.workOrder.findFirst({
    where: { id, deletedAt: null },
    include: {
      serviceRequest: {
        include: {
          customer: {
            select: { id: true, name: true, email: true, phone: true, address: true },
          },
          category: true,
        },
      },
      technician: {
        include: {
          user: { select: { id: true, name: true, phone: true, email: true } },
        },
      },
      serviceReport: true,
      invoice: {
        include: {
          payments: true,
        },
      },
      review: true,
    },
  });

  if (!workOrder) {
    throw new AppError(404, 'Work order not found');
  }

  if (
    user.role === UserRole.CUSTOMER &&
    workOrder.serviceRequest.customerId !== user.userId
  ) {
    throw new AppError(403, 'You do not have permission to view this work order');
  }

  if (
    user.role === UserRole.TECHNICIAN &&
    workOrder.technician.userId !== user.userId
  ) {
    throw new AppError(403, 'You do not have permission to view this work order');
  }

  return workOrder;
};

const updateWorkOrderStatus = async (
  id: string,
  user: TAuthUser,
  payload: { status: WorkOrderStatus; technicianNotes?: string },
) => {
  const workOrder = await prisma.workOrder.findFirst({
    where: { id, deletedAt: null },
    include: { technician: true },
  });

  if (!workOrder) {
    throw new AppError(404, 'Work order not found');
  }

  if (
    user.role === UserRole.TECHNICIAN &&
    workOrder.technician.userId !== user.userId
  ) {
    throw new AppError(403, 'You are not assigned to this work order');
  }

  // allowed status transitions
  const allowedTransitions: Record<WorkOrderStatus, WorkOrderStatus[]> = {
    [WorkOrderStatus.SCHEDULED]: [
      WorkOrderStatus.EN_ROUTE,
      WorkOrderStatus.CANCELLED,
    ],
    [WorkOrderStatus.EN_ROUTE]: [
      WorkOrderStatus.IN_PROGRESS,
      WorkOrderStatus.CANCELLED,
    ],
    [WorkOrderStatus.IN_PROGRESS]: [WorkOrderStatus.COMPLETED],
    [WorkOrderStatus.COMPLETED]: [],
    [WorkOrderStatus.CANCELLED]: [],
  };

  const validNextStatuses = allowedTransitions[workOrder.status];

  if (!validNextStatuses.includes(payload.status)) {
    throw new AppError(
      400,
      `Cannot transition work order from ${workOrder.status} to ${payload.status}`,
    );
  }

  const updateData: any = {
    status: payload.status,
    technicianNotes: payload.technicianNotes || workOrder.technicianNotes,
  };

  if (payload.status === WorkOrderStatus.COMPLETED) {
    updateData.completedAt = new Date();
  }

  const result = await prisma.workOrder.update({
    where: { id },
    data: updateData,
  });

  await prisma.auditLog.create({
    data: {
      userId: user.userId,
      action: 'WORK_ORDER_STATUS_CHANGED',
      entity: 'WorkOrder',
      entityId: id,
      details: JSON.stringify({ from: workOrder.status, to: payload.status }),
    },
  });

  return result;
};

export const WorkOrderService = {
  assignWorkOrder,
  getAllWorkOrders,
  getWorkOrderById,
  updateWorkOrderStatus,
};

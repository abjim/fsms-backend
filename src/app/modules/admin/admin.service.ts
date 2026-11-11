import { PaymentStatus, Prisma, UserRole, UserStatus, WorkOrderStatus } from '@prisma/client';
import config from '../../config';
import AppError from '../../errors/AppError';
import prisma from '../../shared/prisma';
import calculatePagination from '../../utils/calculatePagination';

const getDashboardStats = async () => {
  const [
    totalCustomers,
    totalTechnicians,
    totalServiceRequests,
    pendingRequests,
    activeWorkOrders,
    completedWorkOrders,
    totalRevenueData,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.user.count({ where: { role: UserRole.CUSTOMER, deletedAt: null } }),
    prisma.user.count({ where: { role: UserRole.TECHNICIAN, deletedAt: null } }),
    prisma.serviceRequest.count({ where: { deletedAt: null } }),
    prisma.serviceRequest.count({ where: { status: 'PENDING', deletedAt: null } }),
    prisma.workOrder.count({
      where: {
        status: {
          in: [
            WorkOrderStatus.SCHEDULED,
            WorkOrderStatus.EN_ROUTE,
            WorkOrderStatus.IN_PROGRESS,
          ],
        },
        deletedAt: null,
      },
    }),
    prisma.workOrder.count({
      where: { status: WorkOrderStatus.COMPLETED, deletedAt: null },
    }),
    prisma.payment.aggregate({
      where: { status: PaymentStatus.COMPLETED },
      _sum: { amount: true },
    }),
    prisma.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
  ]);

  return {
    totalCustomers,
    totalTechnicians,
    totalServiceRequests,
    pendingRequests,
    activeWorkOrders,
    completedWorkOrders,
    totalRevenue: totalRevenueData._sum.amount || 0,
    recentAuditLogs,
  };
};

const getAuditLogs = async (params: any, options: any) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);
  const { action, entity, userId } = params;

  const andConditions: Prisma.AuditLogWhereInput[] = [];

  if (action) {
    andConditions.push({ action });
  }

  if (entity) {
    andConditions.push({ entity });
  }

  if (userId) {
    andConditions.push({ userId });
  }

  const whereConditions: Prisma.AuditLogWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [result, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
    prisma.auditLog.count({ where: whereConditions }),
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

const updateUserStatus = async (
  adminId: string,
  targetUserId: string,
  status: UserStatus,
) => {
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!user || user.deletedAt) {
    throw new AppError(404, 'User not found');
  }

  // demo admin cannot be suspended on live server
  if (user.email.toLowerCase() === config.admin.email.toLowerCase()) {
    throw new AppError(400, 'Cannot change status of primary demo admin account');
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { status },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'USER_STATUS_UPDATED',
      entity: 'User',
      entityId: targetUserId,
      details: JSON.stringify({ previousStatus: user.status, newStatus: status }),
    },
  });

  return updatedUser;
};

export const AdminService = {
  getDashboardStats,
  getAuditLogs,
  updateUserStatus,
};

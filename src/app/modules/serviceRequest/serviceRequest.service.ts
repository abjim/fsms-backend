import { Prisma, ServiceRequestStatus, UserRole } from '@prisma/client';
import AppError from '../../errors/AppError';
import { TAuthUser } from '../../interface/common';
import prisma from '../../shared/prisma';
import calculatePagination from '../../utils/calculatePagination';

const createServiceRequest = async (
  customerId: string,
  payload: {
    title: string;
    description: string;
    categoryId: string;
    priority?: any;
    address: string;
    city: string;
    preferredDate: string;
    preferredTime: string;
    contactPhone: string;
  },
) => {
  const category = await prisma.serviceCategory.findFirst({
    where: { id: payload.categoryId, deletedAt: null },
  });

  if (!category) {
    throw new AppError(404, 'Category not found');
  }

  const result = await prisma.serviceRequest.create({
    data: {
      customerId,
      categoryId: payload.categoryId,
      title: payload.title,
      description: payload.description,
      priority: payload.priority,
      address: payload.address,
      city: payload.city,
      preferredDate: new Date(payload.preferredDate),
      preferredTime: payload.preferredTime,
      contactPhone: payload.contactPhone,
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
  });

  // record audit log
  await prisma.auditLog.create({
    data: {
      userId: customerId,
      action: 'SERVICE_REQUEST_CREATED',
      entity: 'ServiceRequest',
      entityId: result.id,
      details: JSON.stringify({ title: result.title, priority: result.priority }),
    },
  });

  return result;
};

const getAllServiceRequests = async (
  user: TAuthUser,
  params: any,
  options: any,
) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);
  const { searchTerm, status, priority, categoryId, city } = params;

  const andConditions: Prisma.ServiceRequestWhereInput[] = [
    { deletedAt: null },
  ];

  // customer sees only their requests
  if (user.role === UserRole.CUSTOMER) {
    andConditions.push({ customerId: user.userId });
  }

  if (searchTerm) {
    andConditions.push({
      OR: [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { address: { contains: searchTerm, mode: 'insensitive' } },
        { city: { contains: searchTerm, mode: 'insensitive' } },
      ],
    });
  }

  if (status) {
    andConditions.push({ status });
  }

  if (priority) {
    andConditions.push({ priority });
  }

  if (categoryId) {
    andConditions.push({ categoryId });
  }

  if (city) {
    andConditions.push({ city: { equals: city, mode: 'insensitive' } });
  }

  const whereConditions: Prisma.ServiceRequestWhereInput = {
    AND: andConditions,
  };

  const [result, total] = await Promise.all([
    prisma.serviceRequest.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
        workOrder: {
          select: {
            id: true,
            status: true,
            scheduledDate: true,
            technician: {
              select: {
                id: true,
                user: { select: { id: true, name: true, phone: true } },
              },
            },
          },
        },
      },
    }),
    prisma.serviceRequest.count({ where: whereConditions }),
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

const getServiceRequestById = async (id: string, user: TAuthUser) => {
  const request = await prisma.serviceRequest.findFirst({
    where: { id, deletedAt: null },
    include: {
      customer: {
        select: { id: true, name: true, email: true, phone: true, address: true },
      },
      category: true,
      workOrder: {
        include: {
          technician: {
            include: {
              user: { select: { id: true, name: true, phone: true, email: true } },
            },
          },
        },
      },
    },
  });

  if (!request) {
    throw new AppError(404, 'Service request not found');
  }

  if (user.role === UserRole.CUSTOMER && request.customerId !== user.userId) {
    throw new AppError(403, 'You do not have permission to view this request');
  }

  return request;
};

const updateServiceRequest = async (
  id: string,
  user: TAuthUser,
  payload: any,
) => {
  const request = await prisma.serviceRequest.findFirst({
    where: { id, deletedAt: null },
  });

  if (!request) {
    throw new AppError(404, 'Service request not found');
  }

  if (user.role === UserRole.CUSTOMER) {
    if (request.customerId !== user.userId) {
      throw new AppError(403, 'You cannot edit someone else request');
    }
    if (request.status !== ServiceRequestStatus.PENDING) {
      throw new AppError(400, 'Cannot edit request once it has been processed');
    }
  }

  const updateData: any = { ...payload };
  if (payload.preferredDate) {
    updateData.preferredDate = new Date(payload.preferredDate);
  }

  const result = await prisma.serviceRequest.update({
    where: { id },
    data: updateData,
  });

  // record audit log if status changed
  if (payload.status && payload.status !== request.status) {
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'SERVICE_REQUEST_STATUS_UPDATED',
        entity: 'ServiceRequest',
        entityId: id,
        details: JSON.stringify({ from: request.status, to: payload.status }),
      },
    });
  }

  return result;
};

const cancelServiceRequest = async (id: string, user: TAuthUser) => {
  const request = await prisma.serviceRequest.findFirst({
    where: { id, deletedAt: null },
  });

  if (!request) {
    throw new AppError(404, 'Service request not found');
  }

  if (user.role === UserRole.CUSTOMER && request.customerId !== user.userId) {
    throw new AppError(403, 'You cannot cancel someone else request');
  }

  if (
    request.status === ServiceRequestStatus.ASSIGNED ||
    request.status === ServiceRequestStatus.CANCELLED
  ) {
    throw new AppError(400, `Cannot cancel request in ${request.status} status`);
  }

  const result = await prisma.serviceRequest.update({
    where: { id },
    data: { status: ServiceRequestStatus.CANCELLED },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.userId,
      action: 'SERVICE_REQUEST_CANCELLED',
      entity: 'ServiceRequest',
      entityId: id,
    },
  });

  return result;
};

export const ServiceRequestService = {
  createServiceRequest,
  getAllServiceRequests,
  getServiceRequestById,
  updateServiceRequest,
  cancelServiceRequest,
};

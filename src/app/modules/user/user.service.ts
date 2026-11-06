import { Prisma, UserRole } from '@prisma/client';
import AppError from '../../errors/AppError';
import prisma from '../../shared/prisma';
import calculatePagination from '../../utils/calculatePagination';

const getMyProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      role: true,
      status: true,
      createdAt: true,
      technicianProfile: {
        include: {
          availabilities: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return user;
};

const updateMyProfile = async (userId: string, payload: any) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { technicianProfile: true },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
    const res = await tx.user.update({
      where: { id: userId },
      data: {
        name: payload.name,
        phone: payload.phone,
        address: payload.address,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        status: true,
      },
    });

    if (user.role === UserRole.TECHNICIAN && user.technicianProfile) {
      await tx.technicianProfile.update({
        where: { userId },
        data: {
          bio: payload.bio,
          skills: payload.skills,
          experienceYears: payload.experienceYears,
          hourlyRate: payload.hourlyRate,
          city: payload.city,
          serviceArea: payload.serviceArea,
        },
      });
    }

    return res;
  });

  return updatedUser;
};

const getAllUsers = async (params: any, options: any) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);
  const { searchTerm, role, status } = params;

  const andConditions: Prisma.UserWhereInput[] = [{ deletedAt: null }];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm, mode: 'insensitive' } },
      ],
    });
  }

  if (role) {
    andConditions.push({ role });
  }

  if (status) {
    andConditions.push({ status });
  }

  const whereConditions: Prisma.UserWhereInput = { AND: andConditions };

  const [result, total] = await Promise.all([
    prisma.user.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where: whereConditions }),
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

export const UserService = {
  getMyProfile,
  updateMyProfile,
  getAllUsers,
};

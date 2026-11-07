import { Prisma } from '@prisma/client';
import AppError from '../../errors/AppError';
import prisma from '../../shared/prisma';
import calculatePagination from '../../utils/calculatePagination';

const getAllTechnicians = async (params: any, options: any) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);
  const { searchTerm, city, skill, isAvailable } = params;

  const andConditions: Prisma.TechnicianProfileWhereInput[] = [
    { user: { deletedAt: null } },
  ];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { city: { contains: searchTerm, mode: 'insensitive' } },
        { bio: { contains: searchTerm, mode: 'insensitive' } },
        { user: { name: { contains: searchTerm, mode: 'insensitive' } } },
      ],
    });
  }

  if (city) {
    andConditions.push({ city: { equals: city, mode: 'insensitive' } });
  }

  if (skill) {
    andConditions.push({ skills: { has: skill } });
  }

  if (isAvailable !== undefined) {
    andConditions.push({ isAvailable: isAvailable === 'true' });
  }

  const whereConditions: Prisma.TechnicianProfileWhereInput = {
    AND: andConditions,
  };

  const [result, total] = await Promise.all([
    prisma.technicianProfile.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
          },
        },
        availabilities: true,
      },
    }),
    prisma.technicianProfile.count({ where: whereConditions }),
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

const getTechnicianById = async (id: string) => {
  const technician = await prisma.technicianProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
        },
      },
      availabilities: true,
      reviews: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  if (!technician) {
    throw new AppError(404, 'Technician not found');
  }

  return technician;
};

const updateAvailability = async (
  userId: string,
  slots: { dayOfWeek: number; startTime: string; endTime: string }[],
) => {
  const technician = await prisma.technicianProfile.findUnique({
    where: { userId },
  });

  if (!technician) {
    throw new AppError(404, 'Technician profile not found');
  }

  const result = await prisma.$transaction(async (tx) => {
    // clear previous availability slots
    await tx.technicianAvailability.deleteMany({
      where: { technicianId: technician.id },
    });

    // insert new slots
    const createdSlots = await Promise.all(
      slots.map((slot) =>
        tx.technicianAvailability.create({
          data: {
            technicianId: technician.id,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
          },
        }),
      ),
    );

    return createdSlots;
  });

  return result;
};

const updateAvailabilityStatus = async (
  userId: string,
  isAvailable: boolean,
) => {
  const technician = await prisma.technicianProfile.findUnique({
    where: { userId },
  });

  if (!technician) {
    throw new AppError(404, 'Technician profile not found');
  }

  const result = await prisma.technicianProfile.update({
    where: { id: technician.id },
    data: { isAvailable },
  });

  return result;
};

export const TechnicianService = {
  getAllTechnicians,
  getTechnicianById,
  updateAvailability,
  updateAvailabilityStatus,
};

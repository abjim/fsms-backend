import AppError from '../../errors/AppError';
import prisma from '../../shared/prisma';

const createCategory = async (payload: {
  name: string;
  description?: string;
  icon?: string;
}) => {
  const slug = payload.name.toLowerCase().trim().replace(/\s+/g, '-');

  const isExist = await prisma.serviceCategory.findUnique({
    where: { slug },
  });

  if (isExist) {
    throw new AppError(409, 'Category with this name already exists');
  }

  const result = await prisma.serviceCategory.create({
    data: {
      name: payload.name,
      slug,
      description: payload.description,
      icon: payload.icon,
    },
  });

  return result;
};

const getAllCategories = async () => {
  const result = await prisma.serviceCategory.findMany({
    where: {
      deletedAt: null,
      isActive: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return result;
};

const getCategoryById = async (id: string) => {
  const result = await prisma.serviceCategory.findFirst({
    where: { id, deletedAt: null },
  });

  if (!result) {
    throw new AppError(404, 'Category not found');
  }

  return result;
};

const updateCategory = async (
  id: string,
  payload: {
    name?: string;
    description?: string;
    icon?: string;
    isActive?: boolean;
  },
) => {
  const category = await prisma.serviceCategory.findFirst({
    where: { id, deletedAt: null },
  });

  if (!category) {
    throw new AppError(404, 'Category not found');
  }

  const updateData: any = { ...payload };
  if (payload.name) {
    updateData.slug = payload.name.toLowerCase().trim().replace(/\s+/g, '-');
  }

  const result = await prisma.serviceCategory.update({
    where: { id },
    data: updateData,
  });

  return result;
};

const deleteCategory = async (id: string) => {
  const category = await prisma.serviceCategory.findFirst({
    where: { id, deletedAt: null },
  });

  if (!category) {
    throw new AppError(404, 'Category not found');
  }

  // soft delete
  await prisma.serviceCategory.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  return { message: 'Category deleted successfully' };
};

export const CategoryService = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};

import { z } from 'zod';

const createCategoryValidationSchema = z.object({
  name: z.string({ required_error: 'Category name is required' }).min(2),
  description: z.string().optional(),
  icon: z.string().optional(),
});

const updateCategoryValidationSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const CategoryValidation = {
  createCategoryValidationSchema,
  updateCategoryValidationSchema,
};

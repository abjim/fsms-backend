import { Priority, ServiceRequestStatus } from '@prisma/client';
import { z } from 'zod';

const createServiceRequestValidationSchema = z.object({
  title: z.string({ required_error: 'Title is required' }).min(3),
  description: z.string({ required_error: 'Description is required' }).min(10),
  categoryId: z.string({ required_error: 'Category ID is required' }),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  address: z.string({ required_error: 'Address is required' }),
  city: z.string({ required_error: 'City is required' }),
  preferredDate: z.string({ required_error: 'Preferred date is required' }),
  preferredTime: z.string({ required_error: 'Preferred time is required' }),
  contactPhone: z.string({ required_error: 'Contact phone is required' }),
});

const updateServiceRequestValidationSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  priority: z.nativeEnum(Priority).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  contactPhone: z.string().optional(),
  status: z.nativeEnum(ServiceRequestStatus).optional(),
});

export const ServiceRequestValidation = {
  createServiceRequestValidationSchema,
  updateServiceRequestValidationSchema,
};

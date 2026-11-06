import { z } from 'zod';

const updateProfileValidationSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  experienceYears: z.number().optional(),
  hourlyRate: z.number().optional(),
  city: z.string().optional(),
  serviceArea: z.string().optional(),
});

export const UserValidation = {
  updateProfileValidationSchema,
};

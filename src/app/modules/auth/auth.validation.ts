import { UserRole } from '@prisma/client';
import { z } from 'zod';

const registerValidationSchema = z.object({
  name: z.string({ required_error: 'Name is required' }).min(2),
  email: z.string({ required_error: 'Email is required' }).email(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  address: z.string().optional(),
  role: z.nativeEnum(UserRole).default(UserRole.CUSTOMER),
  city: z.string().optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  experienceYears: z.number().optional(),
  hourlyRate: z.number().optional(),
  serviceArea: z.string().optional(),
});

const loginValidationSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).email(),
  password: z.string({ required_error: 'Password is required' }),
});

const changePasswordValidationSchema = z.object({
  oldPassword: z.string({ required_error: 'Old password is required' }),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(6, 'New password must be at least 6 characters'),
});

const refreshTokenValidationSchema = z.object({
  refreshToken: z.string({ required_error: 'Refresh token is required' }),
});

export const AuthValidation = {
  registerValidationSchema,
  loginValidationSchema,
  changePasswordValidationSchema,
  refreshTokenValidationSchema,
};

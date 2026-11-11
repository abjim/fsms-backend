import { UserStatus } from '@prisma/client';
import { z } from 'zod';

const updateUserStatusValidationSchema = z.object({
  status: z.nativeEnum(UserStatus, { required_error: 'Status is required' }),
});

export const AdminValidation = {
  updateUserStatusValidationSchema,
};

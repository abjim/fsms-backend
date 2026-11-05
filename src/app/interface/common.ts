import { UserRole } from '@prisma/client';

export type TAuthUser = {
  userId: string;
  email: string;
  role: UserRole;
};

export type TPaginationOptions = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

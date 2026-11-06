import { UserRole } from '@prisma/client';

export type TRegisterPayload = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  role: UserRole;
  city?: string;
  bio?: string;
  skills?: string[];
  experienceYears?: number;
  hourlyRate?: number;
  serviceArea?: string;
};

export type TLoginPayload = {
  email: string;
  password: string;
};

export type TChangePasswordPayload = {
  oldPassword: string;
  newPassword: string;
};

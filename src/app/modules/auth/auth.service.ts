import { UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import config from '../../config';
import AppError from '../../errors/AppError';
import prisma from '../../shared/prisma';
import { jwtHelpers } from '../../utils/jwtHelpers';
import {
  TChangePasswordPayload,
  TLoginPayload,
  TRegisterPayload,
} from './auth.interface';

const registerUser = async (payload: TRegisterPayload) => {
  const email = payload.email.toLowerCase();

  const isUserExist = await prisma.user.findUnique({
    where: { email },
  });

  if (isUserExist) {
    throw new AppError(409, 'User already exists with this email');
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    config.bcrypt_salt_rounds,
  );

  const newUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: payload.name,
        email,
        password: hashedPassword,
        phone: payload.phone,
        address: payload.address,
        role: payload.role,
      },
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
    });

    if (payload.role === UserRole.TECHNICIAN) {
      await tx.technicianProfile.create({
        data: {
          userId: user.id,
          city: payload.city || 'Dhaka',
          bio: payload.bio,
          skills: payload.skills || [],
          experienceYears: payload.experienceYears || 0,
          hourlyRate: payload.hourlyRate || 0,
          serviceArea: payload.serviceArea,
        },
      });
    }

    return user;
  });

  return newUser;
};

const loginUser = async (payload: TLoginPayload) => {
  const email = payload.email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      technicianProfile: true,
    },
  });

  if (!user || user.deletedAt) {
    throw new AppError(404, 'User not found');
  }

  if (user.status === UserStatus.SUSPENDED) {
    throw new AppError(403, 'Your account is suspended');
  }

  const isPasswordMatch = await bcrypt.compare(payload.password, user.password);

  if (!isPasswordMatch) {
    throw new AppError(401, 'Invalid password');
  }

  const jwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtHelpers.createToken(
    jwtPayload,
    config.jwt.jwt_secret,
    config.jwt.expires_in,
  );

  const refreshToken = jwtHelpers.createToken(
    jwtPayload,
    config.jwt.refresh_token_secret,
    config.jwt.refresh_token_expires_in,
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      technicianProfile: user.technicianProfile,
    },
  };
};

const refreshToken = async (token: string) => {
  let decoded;
  try {
    decoded = jwtHelpers.verifyToken(token, config.jwt.refresh_token_secret);
  } catch {
    throw new AppError(401, 'Invalid refresh token');
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user || user.deletedAt) {
    throw new AppError(404, 'User not found');
  }

  if (user.status === UserStatus.SUSPENDED) {
    throw new AppError(403, 'Your account is suspended');
  }

  const jwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtHelpers.createToken(
    jwtPayload,
    config.jwt.jwt_secret,
    config.jwt.expires_in,
  );

  return { accessToken };
};

const changePassword = async (
  userId: string,
  payload: TChangePasswordPayload,
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.deletedAt) {
    throw new AppError(404, 'User not found');
  }

  const isPasswordMatch = await bcrypt.compare(
    payload.oldPassword,
    user.password,
  );

  if (!isPasswordMatch) {
    throw new AppError(400, 'Old password does not match');
  }

  const hashedPassword = await bcrypt.hash(
    payload.newPassword,
    config.bcrypt_salt_rounds,
  );

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { message: 'Password changed successfully' };
};

export const AuthService = {
  registerUser,
  loginUser,
  refreshToken,
  changePassword,
};

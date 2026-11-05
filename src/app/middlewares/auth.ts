import { UserRole, UserStatus } from '@prisma/client';
import config from '../config';
import AppError from '../errors/AppError';
import prisma from '../shared/prisma';
import catchAsync from '../utils/catchAsync';
import { jwtHelpers } from '../utils/jwtHelpers';

const auth = (...requiredRoles: UserRole[]) => {
  return catchAsync(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError(401, 'You are not authorized!');
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : authHeader;

    let decoded;
    try {
      decoded = jwtHelpers.verifyToken(token, config.jwt.jwt_secret);
    } catch {
      throw new AppError(401, 'Invalid token');
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

    if (requiredRoles.length && !requiredRoles.includes(user.role)) {
      throw new AppError(403, 'You are not authorized to access this route');
    }

    req.user = { userId: user.id, email: user.email, role: user.role };
    next();
  });
};

export default auth;

import { Prisma } from '@prisma/client';
import { TGenericErrorResponse } from '../interface/error';

export const handlePrismaKnownError = (
  err: Prisma.PrismaClientKnownRequestError,
): TGenericErrorResponse => {
  if (err.code === 'P2002') {
    const target = (err.meta?.target as string[] | undefined) ?? [];
    const field = target.join(', ') || 'field';

    return {
      statusCode: 409,
      message: `${field} already exists`,
      errorDetails: [{ path: field, message: `${field} already exists` }],
    };
  }

  if (err.code === 'P2025') {
    return {
      statusCode: 404,
      message: 'Record not found',
      errorDetails: [
        { path: '', message: (err.meta?.cause as string) ?? 'Record not found' },
      ],
    };
  }

  if (err.code === 'P2003') {
    return {
      statusCode: 400,
      message: 'Related record does not exist',
      errorDetails: [
        {
          path: (err.meta?.field_name as string) ?? '',
          message: 'Foreign key constraint failed',
        },
      ],
    };
  }

  return {
    statusCode: 400,
    message: 'Database error',
    errorDetails: [{ path: '', message: err.message }],
  };
};

export const handlePrismaValidationError = (
  err: Prisma.PrismaClientValidationError,
): TGenericErrorResponse => {
  return {
    statusCode: 400,
    message: 'Invalid data was sent to the database',
    errorDetails: [
      { path: '', message: err.message.split('\n').filter(Boolean).pop() ?? '' },
    ],
  };
};

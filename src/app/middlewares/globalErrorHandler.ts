import { Prisma } from '@prisma/client';
import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import config from '../config';
import AppError from '../errors/AppError';
import {
  handlePrismaKnownError,
  handlePrismaValidationError,
} from '../errors/handlePrismaError';
import handleZodError from '../errors/handleZodError';
import { TErrorDetails } from '../interface/error';

const globalErrorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let statusCode = 500;
  let message = 'Something went wrong!';
  let errorDetails: TErrorDetails = [{ path: '', message }];

  if (err instanceof ZodError) {
    const simplified = handleZodError(err);
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorDetails = simplified.errorDetails;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const simplified = handlePrismaKnownError(err);
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorDetails = simplified.errorDetails;
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    const simplified = handlePrismaValidationError(err);
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorDetails = simplified.errorDetails;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorDetails = [{ path: '', message: err.message }];
  } else if (err?.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON body';
    errorDetails = [{ path: 'body', message: 'Request body is not valid JSON' }];
  } else if (err instanceof Error) {
    message = err.message;
    errorDetails = [{ path: '', message: err.message }];
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errorDetails,
    stack: config.env === 'development' ? err?.stack : undefined,
  });
};

export default globalErrorHandler;

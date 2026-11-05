import { ZodError } from 'zod';
import { TErrorDetails, TGenericErrorResponse } from '../interface/error';

const handleZodError = (err: ZodError): TGenericErrorResponse => {
  const errorDetails: TErrorDetails = err.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));

  return {
    statusCode: 400,
    message: 'Validation failed',
    errorDetails,
  };
};

export default handleZodError;

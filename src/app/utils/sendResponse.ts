import { Response } from 'express';

type TMeta = {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
};

type TResponse<T> = {
  statusCode: number;
  message: string;
  meta?: TMeta;
  data: T;
};

const sendResponse = <T>(res: Response, payload: TResponse<T>) => {
  res.status(payload.statusCode).json({
    success: true,
    statusCode: payload.statusCode,
    message: payload.message,
    meta: payload.meta,
    data: payload.data,
  });
};

export default sendResponse;

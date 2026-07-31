import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  res.status(statusCode).json(response);
};

export const sendCreated = <T>(
  res: Response,
  data: T,
  message: string = 'Created successfully'
): void => {
  sendSuccess(res, data, message, 201);
};

export const sendPaginated = <T>(
  res: Response,
  data: PaginatedResponse<T>,
  message: string = 'Success'
): void => {
  res.status(200).json({
    success: true,
    message,
    ...data,
  });
};

export const sendNoContent = (res: Response): void => {
  res.status(204).send();
};

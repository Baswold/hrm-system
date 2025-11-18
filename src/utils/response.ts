import { Response } from 'express';
import { IApiResponse, IErrorResponse } from '../types';
import { HTTP_STATUS } from '../config/constants';

/**
 * Send a success response
 */
export const sendSuccess = <T = any>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = HTTP_STATUS.OK
): Response<IApiResponse<T>> => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send a created response (201)
 */
export const sendCreated = <T = any>(
  res: Response,
  data: T,
  message?: string
): Response<IApiResponse<T>> => {
  return sendSuccess(res, data, message, HTTP_STATUS.CREATED);
};

/**
 * Send a no content response (204)
 */
export const sendNoContent = (res: Response): Response => {
  return res.status(HTTP_STATUS.NO_CONTENT).send();
};

/**
 * Send an error response
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  errors?: any[]
): Response<IErrorResponse> => {
  const response: IErrorResponse = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && errors) {
    response.stack = new Error().stack;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send a bad request response (400)
 */
export const sendBadRequest = (
  res: Response,
  message: string,
  errors?: any[]
): Response<IErrorResponse> => {
  return sendError(res, message, HTTP_STATUS.BAD_REQUEST, errors);
};

/**
 * Send an unauthorized response (401)
 */
export const sendUnauthorized = (
  res: Response,
  message: string = 'Unauthorized'
): Response<IErrorResponse> => {
  return sendError(res, message, HTTP_STATUS.UNAUTHORIZED);
};

/**
 * Send a forbidden response (403)
 */
export const sendForbidden = (
  res: Response,
  message: string = 'Forbidden'
): Response<IErrorResponse> => {
  return sendError(res, message, HTTP_STATUS.FORBIDDEN);
};

/**
 * Send a not found response (404)
 */
export const sendNotFound = (
  res: Response,
  message: string = 'Resource not found'
): Response<IErrorResponse> => {
  return sendError(res, message, HTTP_STATUS.NOT_FOUND);
};

/**
 * Send a conflict response (409)
 */
export const sendConflict = (
  res: Response,
  message: string
): Response<IErrorResponse> => {
  return sendError(res, message, HTTP_STATUS.CONFLICT);
};

/**
 * Send a validation error response (422)
 */
export const sendValidationError = (
  res: Response,
  message: string = 'Validation error',
  errors?: any[]
): Response<IErrorResponse> => {
  return sendError(res, message, HTTP_STATUS.UNPROCESSABLE_ENTITY, errors);
};

/**
 * Send a too many requests response (429)
 */
export const sendTooManyRequests = (
  res: Response,
  message: string = 'Too many requests'
): Response<IErrorResponse> => {
  return sendError(res, message, HTTP_STATUS.TOO_MANY_REQUESTS);
};

/**
 * Send an internal server error response (500)
 */
export const sendInternalError = (
  res: Response,
  message: string = 'Internal server error'
): Response<IErrorResponse> => {
  return sendError(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
};

/**
 * Send a service unavailable response (503)
 */
export const sendServiceUnavailable = (
  res: Response,
  message: string = 'Service unavailable'
): Response<IErrorResponse> => {
  return sendError(res, message, HTTP_STATUS.SERVICE_UNAVAILABLE);
};

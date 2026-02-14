import type { NextFunction, Request, Response } from "express";
import type { ApiError } from "@kroger-mini/contracts";

export class HttpError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new HttpError(404, "NOT_FOUND", `Route not found: ${req.path}`));
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof HttpError) {
    const body: ApiError = {
      code: err.code,
      message: err.message,
      requestId: req.requestId
    };
    res.status(err.statusCode).json(body);
    return;
  }

  const body: ApiError = {
    code: "INTERNAL_ERROR",
    message: "Unexpected server error",
    requestId: req.requestId
  };
  res.status(500).json(body);
}

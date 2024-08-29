/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from "express";

export function globalErrorHandler(
  err: any, // Use 'any' to catch all types of errors
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error(err.stack);

  if (res.headersSent) {
    return next(err); // If headers are already sent, delegate to default Express error handler
  }

  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({
    error: {
      message,
      status,
    },
  });
}

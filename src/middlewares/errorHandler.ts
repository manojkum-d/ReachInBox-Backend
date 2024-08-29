import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error("Error:", err.stack); // Log the error stack for debugging purposes

  if (res.headersSent) {
    return next(err); // Delegate to default Express error handler if headers were already sent
  }

  res.status(500).json({ message: err.message || "Internal Server Error" });
}

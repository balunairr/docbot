import type { NextFunction, Request, Response } from "express";

export interface AppError extends Error {
  statusCode: number;
}

export function isAppError(error: unknown): error is AppError {
  return (
    error instanceof Error &&
    "statusCode" in error &&
    typeof (error as AppError).statusCode === "number"
  );
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = isAppError(error) ? error.statusCode : 500;
  const message =
    error instanceof Error ? error.message : "Internal server error";

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({ error: message });
}

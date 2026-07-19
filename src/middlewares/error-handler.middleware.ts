import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { IErrorMessage } from "../types/errors.types";
import handleZodError from "../errors/handleZodError";
import handlePostgresError from "../errors/handlePostgresError";
import handleMulterError from "../errors/handleMulterError";
import { MulterError } from "multer";
import ApiError from "../errors/ApiErrors";

const isPostgresError = (err: unknown): err is Error & { code?: string } => {
  return (
    err instanceof Error && typeof (err as { code?: unknown }).code === "string"
  );
};

const ErrorHandler: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  void next;
  console.log("err", err);

  let statusCode = 500;
  let message = "Internal server error";
  let errorMessages: IErrorMessage[] = [];

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errorMessages = err.errorMessages ?? [];
  } else if (err instanceof ZodError) {
    const handled = handleZodError(err);
    statusCode = handled.statusCode;
    message = handled.message;
    errorMessages = handled.errorMessages;
  } else if (isPostgresError(err)) {
    const handled = handlePostgresError(err);
    statusCode = handled.statusCode;
    message = handled.message;
    errorMessages = handled.errorMessages;
  } else if (err instanceof MulterError) {
    const handled = handleMulterError(err);
    statusCode = handled.statusCode;
    message = handled.message;
    errorMessages = handled.errorMessages;
  } else if (err instanceof Error && err.message) {
    message = err.message;
  }

  // Log the real details (message + err with sql/origin) server-side.
  (
    req as Request & { log?: { error: (obj: unknown, msg: string) => void } }
  ).log?.error({ err, statusCode }, message);

  const isServerError = statusCode >= 500;
  const isProd = process.env.NODE_ENV === "production";
  const clientMessage =
    isServerError && isProd ? "Internal server error" : message;
  const clientErrors = isServerError && isProd ? [] : errorMessages;

  res.status(statusCode).json({
    success: false,
    message: clientMessage,
    errorMessages: clientErrors,
  });
};

export default ErrorHandler;

import { IErrorMessage } from "../types/errors.types";

class ApiError extends Error {
  statusCode: number;
  errorMessages: IErrorMessage[];
  constructor(
    statusCode: number,
    message: string | undefined,
    errorMessages: IErrorMessage[] = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorMessages = errorMessages;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
export default ApiError;

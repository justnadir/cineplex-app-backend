import { IErrorMessage, IGenericErrorResponse } from "../types/errors.types";

type PostgresLikeError = Error & {
  code?: string;
  constraint?: string;
  column?: string;
  detail?: string;
  hint?: string;
  position?: string;
  table?: string;
  schema?: string;
  severity?: string;
};

const handlePostgresError = (
  error: PostgresLikeError
): IGenericErrorResponse => {
  const errorMessages: IErrorMessage[] = [];

  const field = error.column ?? error.constraint ?? "";

  let statusCode: number;
  let message: string;

  switch (error.code) {
    case "23505": // unique_violation
      statusCode = 409;
      message = "A record with this value already exists";
      errorMessages.push({ path: error.constraint ?? field, message });
      break;

    case "23503": // foreign_key_violation
      statusCode = 409;
      message = "Operation failed due to a related record";
      errorMessages.push({ path: error.constraint ?? field, message });
      break;

    case "23502": // not_null_violation
      statusCode = 400;
      message = `Missing required field${error.column ? `: ${error.column}` : ""}`;
      errorMessages.push({ path: error.column ?? field, message });
      break;

    case "23514": // check_violation
      statusCode = 400;
      message = "A value violates an allowed constraint";
      errorMessages.push({ path: error.constraint ?? field, message });
      break;

    case "22P02": // invalid_text_representation (e.g. non-numeric id)
      statusCode = 400;
      message = "Invalid input format";
      break;

    case "22001": // string_data_right_truncation (value too long)
      statusCode = 400;
      message = "Input value is too long";
      errorMessages.push({ path: error.column ?? field, message });
      break;

    case "42703": // undefined_column (query references a non-existent column)
      statusCode = 500;
      message = "Invalid database query: a referenced column does not exist";
      if (field) errorMessages.push({ path: field, message });
      break;

    case "42P01": // undefined_table (query references a non-existent table)
      statusCode = 500;
      message = "Invalid database query: a referenced table does not exist";
      break;

    default:
      statusCode = 500;
      message = "Database error";
  }

  return { statusCode, message, errorMessages };
};

export default handlePostgresError;

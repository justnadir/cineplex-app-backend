import { MulterError } from "multer";
import { IErrorMessage, IGenericErrorResponse } from "../types/errors.types";

const handleMulterError = (error: MulterError): IGenericErrorResponse => {
  const field = error.field ?? "";
  const statusCode = 400;
  const message = (() => {
    switch (error.code) {
      case "LIMIT_UNEXPECTED_FILE":
        return field
          ? `Unexpected file field "${field}"`
          : "Unexpected file field";

      case "LIMIT_FILE_SIZE":
        return "File is too large";

      case "LIMIT_FILE_COUNT":
        return "Too many files uploaded";

      case "LIMIT_PART_COUNT":
        return "Too many parts in the upload";

      case "LIMIT_FIELD_KEY":
        return "Field name is too long";

      case "LIMIT_FIELD_VALUE":
        return "Field value is too long";

      case "LIMIT_FIELD_COUNT":
        return "Too many fields in the upload";

      default:
        return error.message || "File upload error";
    }
  })();

  const errorMessages: IErrorMessage[] = [{ path: field, message }];

  return { statusCode, message, errorMessages };
};

export default handleMulterError;

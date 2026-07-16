import { ZodError } from "zod";
import { IErrorMessage } from "../types/errors.types";

const handleZodError = (error: ZodError) => {
  const errorMessages: IErrorMessage[] = error.issues.map((issue) => {
    const fullPath = issue.path.map(String);
    const path =
      fullPath.length > 1 ? fullPath.slice(1).join(".") : fullPath.join(".");

    let message = issue.message;

    if (issue.code === "unrecognized_keys") {
      const isSingle = issue.keys.length === 1;
      message = `Unexpected ${isSingle ? "field" : "fields"}: ${issue.keys.join(", ")}. Only allowed fields can be sent.`;
    }

    return { path, message };
  });

  return {
    statusCode: 400,
    message: "Validation Error",
    errorMessages,
  };
};

export default handleZodError;

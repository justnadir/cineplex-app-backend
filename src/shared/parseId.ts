import { StatusCodes } from "http-status-codes";
import ApiError from "../errors/ApiErrors";

const parseId = (value: unknown, label = "id"): number => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid ${label}`);
  }
  return id;
};

export default parseId;

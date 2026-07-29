import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { getMultipleFilesPath, getSingleFilePath } from "../shared/getFilePath";
import ApiError from "../errors/ApiErrors";
import { FolderName } from "../types/upload-directories.types";

export const attachSingleFile =
  (field: FolderName, bodyKey: string = field) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const filePath = await getSingleFilePath(req.files, field);
      req.body = { ...req.body, [bodyKey]: filePath };
      next();
    } catch {
      next(new ApiError(StatusCodes.BAD_REQUEST, `Failed to process ${field}`));
    }
  };

export const attachMultipleFiles =
  (field: FolderName, bodyKey: string = field) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const filePaths = await getMultipleFilesPath(req?.files, field);
      req.body = { ...req.body, [bodyKey]: filePaths };
      next();
    } catch {
      next(new ApiError(StatusCodes.BAD_REQUEST, `Failed to process ${field}`));
    }
  };

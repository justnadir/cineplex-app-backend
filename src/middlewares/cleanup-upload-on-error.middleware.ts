import { Request, Response, NextFunction } from "express";
import fs from "fs/promises";
import logger from "../shared/logger";

export const cleanupUploadOnError = async (
  err: unknown,
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const filesToClean: Express.Multer.File[] = req.file
    ? [req.file]
    : req.files
      ? (req.files as Express.Multer.File[])
      : [];

  for (const file of filesToClean) {
    if (file?.path) {
      try {
        await fs.unlink(file.path);
        logger.debug(`Cleaned up file after failed request: ${file.path}`);
      } catch (unlinkErr) {
        logger.warn({ unlinkErr }, `Failed to clean up file: ${file.path}`);
      }
    }
  }
  next(err);
};

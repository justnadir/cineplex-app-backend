import { Request, Response, NextFunction, RequestHandler } from "express";

const catchAsync =
  (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
  ): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export default catchAsync;

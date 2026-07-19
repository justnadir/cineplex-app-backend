import { Request, Response, NextFunction } from "express";

export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const cookieCsrfToken = req?.cookies?.csrfToken;

  if (!cookieCsrfToken) {
    return res.status(403).json({
      success: false,
      message: "Invalid CSRF token",
    });
  }

  next();
};

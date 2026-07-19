import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import { TokenService } from "../utils/token";
import ApiError from "../errors/ApiErrors";
import { USER_ROLES } from "../enums";

export class AuthMiddleware {
  private tokenService = new TokenService();

  public authenticate = (
    req: Request,
    _res: Response,
    next: NextFunction
  ): void => {
    try {
      const header = req.headers.authorization;
      const fromHeader = header?.startsWith("Bearer ")
        ? header.slice(7)
        : undefined;

      const token = fromHeader;
      if (!token) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required");
      }

      const verifyToken = this.tokenService.verifyAccessToken(token);
      req.user = verifyToken;

      next();
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        return next(
          new ApiError(StatusCodes.UNAUTHORIZED, "Access token expired")
        );
      }
      if (err instanceof jwt.JsonWebTokenError) {
        return next(
          new ApiError(StatusCodes.UNAUTHORIZED, "Invalid access token")
        );
      }
      next(err);
    }
  };

  public authorize = (...roles: USER_ROLES[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
      if (!req.user) {
        return next(
          new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required")
        );
      }
      if (roles.length && !roles.includes(req.user.role)) {
        return next(
          new ApiError(
            StatusCodes.FORBIDDEN,
            "You do not have permission to perform this action"
          )
        );
      }
      next();
    };
  };
}

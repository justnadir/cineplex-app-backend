import { Router } from "express";
import validateRequest from "../../middlewares/request-validator.middleware";
import { authLimiter } from "../../middlewares/rate-limiter.middleware";
import { RefreshTokenController } from "./refresh_token.controller";
import { RefreshTokenValidator } from "./refresh_token.validator";
import { AuthMiddleware } from "../../middlewares/authentication-middlware";
import { csrfProtection } from "../../middlewares/csrf-protection.middleware";

export class RefreshTokenRoutes {
  public router: Router;
  private refreshTokenController: RefreshTokenController;
  private validator: RefreshTokenValidator;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.refreshTokenController = new RefreshTokenController();
    this.validator = new RefreshTokenValidator();
    this.authMiddleware = new AuthMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/access_token_generate",
      authLimiter,
      csrfProtection,
      this.refreshTokenController.regenarateToken
    );
    this.router.patch(
      "/:id",
      authLimiter,
      this.authMiddleware.authenticate,
      validateRequest(this.validator.revokZodSchema),
      this.refreshTokenController.revokeToken
    );
  }
}

export default new RefreshTokenRoutes().router;

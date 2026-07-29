import { Router } from "express";
import validateRequest from "../../middlewares/request-validator.middleware";
import {
  authLimiter,
  createRateLimiter,
  writeLimiter,
} from "../../middlewares/rate-limiter.middleware";
import { AuthMiddleware } from "../../middlewares/authentication-middlware";
import { AuthController } from "./auth.controller";
import { AuthValidator } from "./auth.validator";
import { csrfProtection } from "../../middlewares/csrf-protection.middleware";
import { RefreshTokenController } from "../refresh_token/refresh_token.controller";

export class AuthRoutes {
  public router: Router;
  private authController: AuthController;
  private authMiddleware: AuthMiddleware;
  private validator: AuthValidator;
  private refreshTokenController: RefreshTokenController;
  constructor() {
    this.router = Router();
    this.refreshTokenController = new RefreshTokenController();
    this.authController = new AuthController();
    this.validator = new AuthValidator();
    this.authMiddleware = new AuthMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      "/login",
      writeLimiter,
      validateRequest(this.validator.loginZodSchema),
      this.authController.login
    );

    this.router.get(
      "/access_token_generate",
      authLimiter,
      csrfProtection,
      this.refreshTokenController.regenarateToken
    );

    this.router.post(
      "/verify-otp",
      createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }),
      validateRequest(this.validator.verifyOtpZodSchema),
      this.authController.verifyOtp
    );

    this.router.post(
      "/resend-otp",
      createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }),
      validateRequest(this.validator.resendOtpZodSchema),
      this.authController.resendOtp
    );

    this.router.patch(
      "/forgot-password",
      createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }),
      validateRequest(this.validator.forgotPasswordZodSchema),
      this.authController.forgotPassword
    );

    this.router.patch(
      "/reset-password",
      createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }),
      validateRequest(this.validator.resetPasswordZodSchema),
      this.authController.resetPassword
    );

    this.router.patch(
      "/delete-account",
      createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }),
      this.authMiddleware.authenticate,
      validateRequest(this.validator.resetPasswordZodSchema),
      this.authController.deleteAccount
    );

    this.router.patch(
      "/recovery-account",
      createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }),
      this.authController.recoveryAccount
    );
  }
}

export default new AuthRoutes().router;

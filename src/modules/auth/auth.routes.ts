import { Router } from "express";
import fileUploadHandler from "../../middlewares/fileUploaderHandler";
import validateRequest from "../../middlewares/validateRequest";
import { createRateLimiter, writeLimiter } from "../../middlewares/rateLimiter";
import { AuthMiddleware } from "../../middlewares/auth";
import { AuthController } from "./auth.controller";
import { AuthValidator } from "./auth.validator";

export class NewsRoutes {
  public router: Router;
  private authController: AuthController;
  private authMiddleware: AuthMiddleware;
  private validator: AuthValidator;

  constructor() {
    this.router = Router();
    this.authController = new AuthController();
    this.validator = new AuthValidator();
    this.authMiddleware = new AuthMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router
      .route("/login")
      .post(
        writeLimiter,
        fileUploadHandler(),
        validateRequest(this.validator.loginZodSchema),
        this.authController.login
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
      // validateRequest(this.validator.resetPasswordZodSchema),
      this.authController.deleteAccount
    );

    this.router.patch(
      "/recovery-account",
      createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }),
      this.authController.recoveryAccount
    );
  }
}

export default new NewsRoutes().router;

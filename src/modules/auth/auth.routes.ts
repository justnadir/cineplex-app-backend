import { Router } from "express";
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
import { defineRoute } from "../../shared/openapi/route-builder";

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
    defineRoute(
      this.router,
      {
        method: "post",
        path: "/login",
        tags: ["Auth"],
        summary: "Login with email and password",
        description:
          "Authenticates a user with email/username and password, and returns a JWT access token (and typically triggers OTP verification depending on account settings). Public endpoint, rate-limited. Request body validated against loginZodSchema.",
        schema: this.validator.loginZodSchema,
        middlewares: [writeLimiter],
        handler: this.authController.login,
      },
      "/auth"
    );

    defineRoute(
      this.router,
      {
        method: "get",
        path: "/access_token_generate",
        tags: ["Auth"],
        summary: "Regenerate access token",
        description:
          "Generates a new access token using a valid refresh token (typically sent via cookie). CSRF-protected and rate-limited.",
        middlewares: [authLimiter, csrfProtection],
        handler: this.refreshTokenController.regenarateToken,
      },
      "/auth"
    );

    defineRoute(
      this.router,
      {
        method: "post",
        path: "/verify-otp",
        tags: ["Auth"],
        summary: "Verify OTP",
        description:
          "Verifies the one-time password (OTP) sent to the user's email/phone during login or account verification. Public endpoint, rate-limited to 5 requests per 15 minutes. Request body validated against verifyOtpZodSchema.",
        schema: this.validator.verifyOtpZodSchema,
        middlewares: [createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 })],
        handler: this.authController.verifyOtp,
      },
      "/auth"
    );

    defineRoute(
      this.router,
      {
        method: "post",
        path: "/resend-otp",
        tags: ["Auth"],
        summary: "Resend OTP",
        description:
          "Resends a new OTP to the user's registered email/phone if the previous one expired or wasn't received. Public endpoint, rate-limited to 5 requests per 15 minutes. Request body validated against resendOtpZodSchema.",
        schema: this.validator.resendOtpZodSchema,
        middlewares: [createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 })],
        handler: this.authController.resendOtp,
      },
      "/auth"
    );

    defineRoute(
      this.router,
      {
        method: "patch",
        path: "/forgot-password",
        tags: ["Auth"],
        summary: "Request password reset",
        description:
          "Initiates the forgot-password flow by sending a password reset link/OTP to the user's registered email. Public endpoint, rate-limited to 5 requests per 15 minutes. Request body validated against forgotPasswordZodSchema.",
        schema: this.validator.forgotPasswordZodSchema,
        middlewares: [createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 })],
        handler: this.authController.forgotPassword,
      },
      "/auth"
    );

    defineRoute(
      this.router,
      {
        method: "patch",
        path: "/reset-password",
        tags: ["Auth"],
        summary: "Reset password",
        description:
          "Resets the user's password using the token/OTP received from the forgot-password flow. Public endpoint, rate-limited to 5 requests per 15 minutes. Request body validated against resetPasswordZodSchema.",
        schema: this.validator.resetPasswordZodSchema,
        middlewares: [createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 })],
        handler: this.authController.resetPassword,
      },
      "/auth"
    );

    defineRoute(
      this.router,
      {
        method: "patch",
        path: "/delete-account",
        tags: ["Auth"],
        summary: "Delete own account",
        description:
          "Allows the currently authenticated user to delete their own account. Requires a valid Bearer token. Rate-limited to 5 requests per 15 minutes. Request body validated against resetPasswordZodSchema.",
        auth: true,
        schema: this.validator.resetPasswordZodSchema,
        middlewares: [
          createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }),
          this.authMiddleware.authenticate,
        ],
        handler: this.authController.deleteAccount,
      },
      "/auth"
    );

    defineRoute(
      this.router,
      {
        method: "patch",
        path: "/recovery-account",
        tags: ["Auth"],
        summary: "Recover a deleted/deactivated account",
        description:
          "Allows a user to recover their previously deleted or deactivated account, typically via a verification step (e.g. OTP or recovery token). Public endpoint, rate-limited to 5 requests per 15 minutes.",
        middlewares: [createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 })],
        handler: this.authController.recoveryAccount,
      },
      "/auth"
    );
  }
}

export default new AuthRoutes().router;

import { Router } from "express";
import { defineRoute } from "../../shared/openapi/route-builder";
import { UserController } from "./user.controller";
import { UserValidator } from "./user.validator";
import { createRateLimiter } from "../../middlewares/rate-limiter.middleware";
import { AuthMiddleware } from "../../middlewares/authentication-middlware";
import { csrfProtection } from "../../middlewares/csrf-protection.middleware";

export class UserRoutes {
  public router: Router;
  private userController: UserController;
  private validator: UserValidator;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.userController = new UserController();
    this.validator = new UserValidator();
    this.authMiddleware = new AuthMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    defineRoute(
      this.router,
      {
        method: "post",
        path: "/signup",
        tags: ["Users"],
        summary: "Register a new user",
        description:
          "Creates a new user account. This is a public endpoint — no authentication required. Rate-limited to 5 requests per 15 minutes per IP to prevent abuse. Request body validated against createUserZodSchema.",
        schema: this.validator.createUserZodSchema,
        middlewares: [createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 })],
        handler: this.userController.create,
      },
      "/user"
    );

    defineRoute(
      this.router,
      {
        method: "get",
        path: "/me",
        tags: ["Users"],
        summary: "Retrieve logged-in user's profile",
        description:
          "Returns the profile information of the currently authenticated user, based on the JWT provided in the Authorization header. Requires a valid Bearer token.",
        auth: true,
        middlewares: [
          createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }),
          this.authMiddleware.authenticate,
        ],
        handler: this.userController.retrieveProfile,
      },
      "/user"
    );

    defineRoute(
      this.router,
      {
        method: "patch",
        path: "/change_password",
        tags: ["Users"],
        summary: "Change account password",
        description:
          "Allows the currently authenticated user to change their own password. Requires a valid Bearer token and CSRF protection. Request body validated against changePasswordZodSchema.",
        schema: this.validator.changePasswordZodSchema,
        auth: true,
        middlewares: [
          createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }),
          this.authMiddleware.authenticate,
          csrfProtection,
        ],
        handler: this.userController.changePassword,
      },
      "/user"
    );
  }
}

export default new UserRoutes().router;

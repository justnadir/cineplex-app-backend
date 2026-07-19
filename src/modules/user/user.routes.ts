import { Router } from "express";
import { UserController } from "./user.controller";
import { UserValidator } from "./user.validator";
import validateRequest from "../../middlewares/request-validator.middleware";
import { createRateLimiter } from "../../middlewares/rate-limiter.middleware";
import { AuthMiddleware } from "../../middlewares/authentication-middlware";
import { USER_ROLES } from "../../enums";

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
    this.router.post(
      "/signup",
      createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }),
      validateRequest(this.validator.createUserZodSchema),
      this.userController.create
    );
    this.router.get(
      "/me",
      createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }),
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(USER_ROLES.USER),
      this.userController.retrieveProfile
    );
    this.router.patch(
      "/change_password",
      createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }),
      this.authMiddleware.authenticate,
      validateRequest(this.validator.changePasswordZodSchema),
      this.userController.changePassword
    );
  }
}

export default new UserRoutes().router;

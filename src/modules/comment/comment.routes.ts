import { Router } from "express";
import { CommentController } from "./comment.controller";
import { CommentValidator } from "./comment.validation";
import { writeLimiter } from "../../middlewares/rate-limiter.middleware";
import validateRequest from "../../middlewares/request-validator.middleware";
import { AuthMiddleware } from "../../middlewares/authentication-middlware";
import { USER_ROLES } from "../../enums";

export class CommentRoutes {
  public router: Router;
  private commentController: CommentController;
  private validator: CommentValidator;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.commentController = new CommentController();
    this.validator = new CommentValidator();
    this.authMiddleware = new AuthMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      "/create-comment",
      writeLimiter,
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
      validateRequest(this.validator.createCommentZodSchema),
      this.commentController.create
    );

    this.router.get(
      "/:id/admin",
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
      validateRequest(this.validator.listAdminCommentQuerySchema),
      this.commentController.retrieveAll
    );

    this.router.patch(
      "/:id/status",
      writeLimiter,
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
      validateRequest(this.validator.moderateCommentZodSchema),
      this.commentController.moderate
    );

    this.router.get(
      "/:id",
      validateRequest(this.validator.listPublicCommentParamsSchema),
      this.commentController.retrievePublic
    );
  }
}

export default new CommentRoutes().router;

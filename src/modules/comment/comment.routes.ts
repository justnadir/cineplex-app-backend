import { Router } from "express";
import { CommentController } from "./comment.controller";
import { CommentValidator } from "./comment.validation";
import { writeLimiter } from "../../middlewares/rate-limiter.middleware";
import { AuthMiddleware } from "../../middlewares/authentication-middlware";
import { USER_ROLES } from "../../enums";
import { defineRoute } from "../../shared/openapi/route-builder";

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
    defineRoute(
      this.router,
      {
        method: "post",
        path: "/create-comment",
        tags: ["News Comments"],
        summary: "Create a new comment on a news article",
        description:
          "Allows an authenticated Admin or Super Admin to create a new comment on a news article. The request body must satisfy the createCommentZodSchema validation rules.",
        schema: this.validator.createCommentZodSchema,
        auth: true,
        middlewares: [
          writeLimiter,
          this.authMiddleware.authenticate,
          this.authMiddleware.authorize(
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.ADMIN
          ),
        ],
        handler: this.commentController.create,
      },
      "/comment"
    );

    defineRoute(
      this.router,
      {
        method: "get",
        path: "/:id/admin",
        tags: ["News Comments"],
        summary: "Retrieve all comments for a news article (Admin)",
        description:
          "Allows an authenticated Admin or Super Admin to fetch all comments (including unapproved/hidden ones) for a specific news article, identified by the `id` param. Supports filtering/pagination via listAdminCommentQuerySchema.",
        schema: this.validator.listAdminCommentQuerySchema,
        auth: true,
        middlewares: [
          this.authMiddleware.authenticate,
          this.authMiddleware.authorize(
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.ADMIN
          ),
        ],
        handler: this.commentController.retrieveAll,
      },
      "/comment"
    );

    defineRoute(
      this.router,
      {
        method: "patch",
        path: "/:id/status",
        tags: ["News Comments"],
        summary: "Moderate a comment's status",
        description:
          "Allows an authenticated Admin or Super Admin to approve, reject, or otherwise change the moderation status of a comment identified by `id`. Request body validated against moderateCommentZodSchema.",
        schema: this.validator.moderateCommentZodSchema,
        auth: true,
        middlewares: [
          writeLimiter,
          this.authMiddleware.authenticate,
          this.authMiddleware.authorize(
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.ADMIN
          ),
        ],
        handler: this.commentController.moderate,
      },
      "/comment"
    );

    defineRoute(
      this.router,
      {
        method: "get",
        path: "/:id",
        tags: ["News Comments"],
        summary: "Retrieve public comments for a news article",
        description:
          "Publicly accessible endpoint (no authentication required) to fetch the approved/visible comments for a news article identified by `id`. Query params validated against listPublicCommentParamsSchema.",
        schema: this.validator.listPublicCommentParamsSchema,
        handler: this.commentController.retrievePublic,
      },
      "/comment"
    );
  }
}

export default new CommentRoutes().router;

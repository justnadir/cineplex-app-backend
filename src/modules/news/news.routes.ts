import { Router } from "express";
import { NewsController } from "./news.controller";
import { writeLimiter } from "../../middlewares/rate-limiter.middleware";
import fileUploadHandler from "../../middlewares/file-upload.middleware";
import { attachSingleFile } from "../../middlewares/uploaded-file-processor.middleware";
import { validIdParamCheckSchema } from "../../validators";
import { NewsValidator } from "./news.validation";
import { AuthMiddleware } from "../../middlewares/authentication-middlware";
import { USER_ROLES } from "../../enums";
import { FOLDERS_NAMES } from "../../types/upload-directories.types";
import { csrfProtection } from "../../middlewares/csrf-protection.middleware";
import { defineRoute } from "../../shared/openapi/route-builder";

export class NewsRoutes {
  public router: Router;
  private newsController: NewsController;
  private validator: NewsValidator;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.newsController = new NewsController();
    this.validator = new NewsValidator();
    this.authMiddleware = new AuthMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    defineRoute(
      this.router,
      {
        method: "post",
        path: "/create-news",
        tags: ["News"],
        summary: "Create a new news article",
        description:
          "Allows an authenticated Admin or Super Admin to create a new news article, including uploading a news image. Requires multipart/form-data. CSRF-protected and rate-limited. Request body validated against createNewsZodSchema.",
        auth: true,
        schema: this.validator.createNewsZodSchema,
        middlewares: [
          this.authMiddleware.authenticate,
          this.authMiddleware.authorize(
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.ADMIN
          ),
          csrfProtection,
          writeLimiter,
          fileUploadHandler(),
          attachSingleFile(FOLDERS_NAMES.news_image),
        ],
        handler: this.newsController.create,
      },
      "/news"
    );

    defineRoute(
      this.router,
      {
        method: "get",
        path: "/admin-news",
        tags: ["News"],
        summary: "Retrieve all news articles (Admin)",
        description:
          "Allows an authenticated Admin or Super Admin to fetch all news articles, including drafts/unpublished ones, for management purposes. Supports filtering/pagination via query params, validated against adminNewsQuerySchema.",
        auth: true,
        schema: this.validator.adminNewsQuerySchema,
        middlewares: [
          this.authMiddleware.authenticate,
          this.authMiddleware.authorize(
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.ADMIN
          ),
          csrfProtection,
        ],
        handler: this.newsController.retrieve,
      },
      "/news"
    );

    defineRoute(
      this.router,
      {
        method: "get",
        path: "/public-news",
        tags: ["News"],
        summary: "Retrieve published news articles",
        description:
          "Publicly accessible endpoint (no authentication required) to fetch the list of published news articles. Supports filtering/pagination via query params, validated against publicNewsQuerySchema.",
        schema: this.validator.publicNewsQuerySchema,
        handler: this.newsController.retrieve,
      },
      "/news"
    );

    defineRoute(
      this.router,
      {
        method: "get",
        path: "/:id",
        tags: ["News"],
        summary: "Retrieve a single news article",
        description:
          "Publicly accessible endpoint (no authentication required) to fetch a single news article by its `id`. Params validated against validIdParamCheckSchema.",
        schema: validIdParamCheckSchema,
        handler: this.newsController.getSingle,
      },
      "/news"
    );

    defineRoute(
      this.router,
      {
        method: "patch",
        path: "/:id",
        tags: ["News"],
        summary: "Update a news article",
        description:
          "Allows an authenticated Admin or Super Admin to update an existing news article identified by `id`, optionally replacing the news image. Requires multipart/form-data if a new image is uploaded. CSRF-protected and rate-limited. Request body validated against updateNewsZodSchema.",
        auth: true,
        schema: this.validator.updateNewsZodSchema,
        middlewares: [
          this.authMiddleware.authenticate,
          this.authMiddleware.authorize(
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.ADMIN
          ),
          csrfProtection,
          writeLimiter,
          fileUploadHandler(),
          attachSingleFile(FOLDERS_NAMES.news_image),
        ],
        handler: this.newsController.update,
      },
      "/news"
    );

    defineRoute(
      this.router,
      {
        method: "delete",
        path: "/:id",
        tags: ["News"],
        summary: "Delete a news article",
        description:
          "Allows an authenticated Admin or Super Admin to permanently delete a news article identified by `id`. CSRF-protected and rate-limited. Params validated against validIdParamCheckSchema.",
        auth: true,
        schema: validIdParamCheckSchema,
        middlewares: [
          this.authMiddleware.authenticate,
          this.authMiddleware.authorize(
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.ADMIN
          ),
          csrfProtection,
          writeLimiter,
        ],
        handler: this.newsController.delete,
      },
      "/news"
    );
  }
}

export default new NewsRoutes().router;

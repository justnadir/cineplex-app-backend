import { Router } from "express";
import { NewsController } from "./news.controller";
import { writeLimiter } from "../../middlewares/rate-limiter.middleware";
import fileUploadHandler from "../../middlewares/file-upload.middleware";
import { attachSingleFile } from "../../middlewares/uploaded-file-processor.middleware";
import validateRequest from "../../middlewares/request-validator.middleware";
import { validIdParamCheckSchema } from "../../validators";
import { NewsValidator } from "./news.validation";
import { AuthMiddleware } from "../../middlewares/authentication-middlware";
import { USER_ROLES } from "../../enums";
import { cleanupUploadOnError } from "../../middlewares/cleanup-upload-on-error.middleware";
import { FOLDERS_NAMES } from "../../types/upload-directories.types";
import { csrfProtection } from "../../middlewares/csrf-protection.middleware";

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
    this.router.post(
      "/create-news",
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
      csrfProtection,
      writeLimiter,
      fileUploadHandler(),
      attachSingleFile(FOLDERS_NAMES.news_image),
      validateRequest(this.validator.createNewsZodSchema),
      this.newsController.create,
      cleanupUploadOnError
    );

    this.router.get(
      "/admin-news",
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
      csrfProtection,
      validateRequest(this.validator.adminNewsQuerySchema),
      this.newsController.retrieve
    );

    this.router.get(
      "/public-news",
      validateRequest(this.validator.publicNewsQuerySchema),
      this.newsController.retrieve
    );

    this.router
      .route("/:id")
      .get(
        validateRequest(validIdParamCheckSchema),
        this.newsController.getSingle
      )
      .patch(
        this.authMiddleware.authenticate,
        this.authMiddleware.authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
        csrfProtection,
        writeLimiter,
        fileUploadHandler(),
        attachSingleFile(FOLDERS_NAMES.news_image),
        validateRequest(this.validator.updateNewsZodSchema),
        this.newsController.update,
        cleanupUploadOnError
      )
      .delete(
        this.authMiddleware.authenticate,
        this.authMiddleware.authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
        csrfProtection,
        writeLimiter,
        validateRequest(validIdParamCheckSchema),
        this.newsController.delete
      );
  }
}

export default new NewsRoutes().router;

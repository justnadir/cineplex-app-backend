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
    // GET routes public; create/update/delete admin-only.

    this.router.post(
      "/create-news",
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
      writeLimiter,
      fileUploadHandler(),
      attachSingleFile("news_image"),
      validateRequest(this.validator.createNewsZodSchema),
      this.newsController.create
    );

    this.router.get(
      "/admin-news",
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
      validateRequest(this.validator.adminNewsQuerySchema),
      this.newsController.retrieve
    );

    this.router.get(
      "/public-news",
      this.authMiddleware.authenticate,
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
        writeLimiter,
        fileUploadHandler(),
        attachSingleFile("news_image"),
        validateRequest(this.validator.updateNewsZodSchema),
        this.newsController.update
      )
      .delete(
        this.authMiddleware.authenticate,
        this.authMiddleware.authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
        writeLimiter,
        validateRequest(validIdParamCheckSchema),
        this.newsController.delete
      );
  }
}

export default new NewsRoutes().router;

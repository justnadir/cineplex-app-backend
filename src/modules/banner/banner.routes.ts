import { Router } from "express";
import { BannerController } from "./banner.controller";
import { writeLimiter } from "../../middlewares/rate-limiter.middleware";
import fileUploadHandler from "../../middlewares/file-upload.middleware";
import { attachSingleFile } from "../../middlewares/uploaded-file-processor.middleware";
import validateRequest from "../../middlewares/request-validator.middleware";
import { BannerValidator } from "./banner.validation";
import { AuthMiddleware } from "../../middlewares/authentication-middlware";
import { USER_ROLES } from "../../enums";

export class BannerRoutes {
  public router: Router;
  private bannerController: BannerController;
  private validator: BannerValidator;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.bannerController = new BannerController();
    this.validator = new BannerValidator();
    this.authMiddleware = new AuthMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
      writeLimiter,
      fileUploadHandler(),
      attachSingleFile("banner_image"),
      validateRequest(this.validator.createBannerZodSchema),
      this.bannerController.create
    );

    this.router.get("/public-banner", this.bannerController.retrieve);
    this.router.get(
      "/admin-banner",
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
      this.bannerController.retrieve
    );

    this.router
      .route("/:id")
      .patch(
        this.authMiddleware.authenticate,
        this.authMiddleware.authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
        writeLimiter,
        fileUploadHandler(),
        attachSingleFile("banner_image"),
        validateRequest(this.validator.updateBannerZodSchema),
        this.bannerController.update
      )
      .delete(
        this.authMiddleware.authenticate,
        this.authMiddleware.authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
        writeLimiter,
        validateRequest(this.validator.bannerIdParamsSchema),
        this.bannerController.delete
      );
  }
}

export default new BannerRoutes().router;

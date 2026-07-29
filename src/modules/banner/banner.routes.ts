import { Router } from "express";
import { BannerController } from "./banner.controller";
import { writeLimiter } from "../../middlewares/rate-limiter.middleware";
import fileUploadHandler from "../../middlewares/file-upload.middleware";
import { attachSingleFile } from "../../middlewares/uploaded-file-processor.middleware";
import validateRequest from "../../middlewares/request-validator.middleware";
import { BannerValidator } from "./banner.validation";
import { AuthMiddleware } from "../../middlewares/authentication-middlware";
import { USER_ROLES } from "../../enums";
import { csrfProtection } from "../../middlewares/csrf-protection.middleware";
import { FOLDERS_NAMES } from "../../types/upload-directories.types";

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
    this.router.post(
      "/",
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
      csrfProtection,
      writeLimiter,
      fileUploadHandler(),
      attachSingleFile(FOLDERS_NAMES.banner_image),
      validateRequest(this.validator.createBannerZodSchema),
      this.bannerController.create
    );

    this.router.get("/public-banner", this.bannerController.retrieve);
    this.router.get(
      "/admin-banner",
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
      csrfProtection,
      this.bannerController.adminRetrieve
    );

    this.router
      .route("/:id")
      .patch(
        this.authMiddleware.authenticate,
        this.authMiddleware.authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
        csrfProtection,
        writeLimiter,
        fileUploadHandler(),
        attachSingleFile(FOLDERS_NAMES.banner_image),
        validateRequest(this.validator.updateBannerZodSchema),
        this.bannerController.update
      )
      .delete(
        this.authMiddleware.authenticate,
        this.authMiddleware.authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
        csrfProtection,
        writeLimiter,
        validateRequest(this.validator.bannerIdParamsSchema),
        this.bannerController.delete
      );
  }
}

export default new BannerRoutes().router;

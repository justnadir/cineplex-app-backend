import { Router } from "express";
import { BannerController } from "./banner.controller";
import { writeLimiter } from "../../middlewares/rate-limiter.middleware";
import fileUploadHandler from "../../middlewares/file-upload.middleware";
import { attachSingleFile } from "../../middlewares/uploaded-file-processor.middleware";
import { BannerValidator } from "./banner.validation";
import { AuthMiddleware } from "../../middlewares/authentication-middlware";
import { USER_ROLES } from "../../enums";
import { csrfProtection } from "../../middlewares/csrf-protection.middleware";
import { FOLDERS_NAMES } from "../../types/upload-directories.types";
import { defineRoute } from "../../shared/openapi/route-builder";

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
    defineRoute(
      this.router,
      {
        method: "post",
        path: "/",
        tags: ["Banners"],
        summary: "Create a new banner",
        description:
          "Allows an authenticated Admin or Super Admin to upload and create a new banner image. Requires multipart/form-data with the banner image file. Rate-limited and CSRF-protected. Request body validated against createBannerZodSchema.",
        auth: true,
        schema: this.validator.createBannerZodSchema,
        middlewares: [
          this.authMiddleware.authenticate,
          this.authMiddleware.authorize(
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.ADMIN
          ),
          csrfProtection,
          writeLimiter,
          fileUploadHandler(),
          attachSingleFile(FOLDERS_NAMES.banner_image),
        ],
        handler: this.bannerController.create,
      },
      "/banner"
    );

    defineRoute(
      this.router,
      {
        method: "get",
        path: "/public-banner",
        tags: ["Banners"],
        summary: "Retrieve public banners",
        description:
          "Publicly accessible endpoint (no authentication required) to fetch all active banners for display on the site.",
        handler: this.bannerController.retrieve,
      },
      "/banner"
    );

    defineRoute(
      this.router,
      {
        method: "get",
        path: "/admin-banner",
        tags: ["Banners"],
        summary: "Retrieve all banners (Admin)",
        description:
          "Allows an authenticated Admin or Super Admin to fetch all banners, including inactive/hidden ones, for management purposes.",
        auth: true,
        middlewares: [
          this.authMiddleware.authenticate,
          this.authMiddleware.authorize(
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.ADMIN
          ),
          csrfProtection,
        ],
        handler: this.bannerController.adminRetrieve,
      },
      "/banner"
    );

    defineRoute(
      this.router,
      {
        method: "patch",
        path: "/:id",
        tags: ["Banners"],
        summary: "Update a banner",
        description:
          "Allows an authenticated Admin or Super Admin to update an existing banner identified by `id`, optionally replacing the banner image. Requires multipart/form-data if a new image is uploaded. Rate-limited and CSRF-protected. Request body validated against updateBannerZodSchema.",
        auth: true,
        schema: this.validator.updateBannerZodSchema,
        middlewares: [
          this.authMiddleware.authenticate,
          this.authMiddleware.authorize(
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.ADMIN
          ),
          csrfProtection,
          writeLimiter,
          fileUploadHandler(),
          attachSingleFile(FOLDERS_NAMES.banner_image),
        ],
        handler: this.bannerController.update,
      },
      "/banner"
    );

    defineRoute(
      this.router,
      {
        method: "delete",
        path: "/:id",
        tags: ["Banners"],
        summary: "Delete a banner",
        description:
          "Allows an authenticated Admin or Super Admin to permanently delete a banner identified by `id`. Rate-limited and CSRF-protected. Params validated against bannerIdParamsSchema.",
        auth: true,
        schema: this.validator.bannerIdParamsSchema,
        middlewares: [
          this.authMiddleware.authenticate,
          this.authMiddleware.authorize(
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.ADMIN
          ),
          csrfProtection,
          writeLimiter,
        ],
        handler: this.bannerController.delete,
      },
      "/banner"
    );
  }
}

export default new BannerRoutes().router;

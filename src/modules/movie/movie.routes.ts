import { Router } from "express";
import { MovieController } from "./movie.controller";
import { writeLimiter } from "../../middlewares/rate-limiter.middleware";
import fileUploadHandler from "../../middlewares/file-upload.middleware";
import { attachSingleFile } from "../../middlewares/uploaded-file-processor.middleware";
import { MovieValidator } from "./movie.validation";
import { AuthMiddleware } from "../../middlewares/authentication-middlware";
import { USER_ROLES } from "../../enums";
import { validIdParamCheckSchema } from "../../validators";
import { FOLDERS_NAMES } from "../../types/upload-directories.types";
import { csrfProtection } from "../../middlewares/csrf-protection.middleware";
import { defineRoute } from "../../shared/openapi/route-builder";

export class MovieRoutes {
  public router: Router;
  private movieController: MovieController;
  private validator: MovieValidator;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.authMiddleware = new AuthMiddleware();
    this.movieController = new MovieController();
    this.validator = new MovieValidator();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    defineRoute(
      this.router,
      {
        method: "post",
        path: "/create-movie",
        tags: ["Movies"],
        summary: "Create a new movie",
        description:
          "Allows an authenticated Admin or Super Admin to create a new movie entry, including uploading a movie poster image. Requires multipart/form-data. CSRF-protected and rate-limited. Request body validated against createMovieValidatorSchema.",
        auth: true,
        schema: this.validator.createMovieValidatorSchema,
        middlewares: [
          writeLimiter,
          this.authMiddleware.authenticate,
          this.authMiddleware.authorize(
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.ADMIN
          ),
          csrfProtection,
          fileUploadHandler(),
          attachSingleFile(FOLDERS_NAMES.movie_poster),
        ],
        handler: this.movieController.create,
      },
      "/movie"
    );

    defineRoute(
      this.router,
      {
        method: "get",
        path: "/public-movies",
        tags: ["Movies"],
        summary: "Retrieve public movie listings",
        description:
          "Publicly accessible endpoint (no authentication required) to fetch the list of published movies. Supports filtering/pagination via query params, validated against listMovieQueryValidatorSchema.",
        schema: this.validator.listMovieQueryValidatorSchema,
        handler: this.movieController.retrieve,
      },
      "/movie"
    );

    defineRoute(
      this.router,
      {
        method: "patch",
        path: "/:id",
        tags: ["Movies"],
        summary: "Update a movie",
        description:
          "Allows an authenticated Admin or Super Admin to update an existing movie identified by `id`, optionally replacing the movie poster image. Requires multipart/form-data if a new poster is uploaded. CSRF-protected and rate-limited. Request body validated against updateMovieValidatorSchema.",
        auth: true,
        schema: this.validator.updateMovieValidatorSchema,
        middlewares: [
          writeLimiter,
          this.authMiddleware.authenticate,
          this.authMiddleware.authorize(
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.ADMIN
          ),
          csrfProtection,
          fileUploadHandler(),
          attachSingleFile(FOLDERS_NAMES.movie_poster),
        ],
        handler: this.movieController.update,
      },
      "/movie"
    );

    defineRoute(
      this.router,
      {
        method: "delete",
        path: "/:id",
        tags: ["Movies"],
        summary: "Delete a movie",
        description:
          "Allows an authenticated Admin or Super Admin to permanently delete a movie identified by `id`. CSRF-protected and rate-limited. Params validated against validIdParamCheckSchema.",
        auth: true,
        schema: validIdParamCheckSchema,
        middlewares: [
          writeLimiter,
          this.authMiddleware.authenticate,
          this.authMiddleware.authorize(
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.ADMIN
          ),
          csrfProtection,
        ],
        handler: this.movieController.delete,
      },
      "/movie"
    );
  }
}

export default new MovieRoutes().router;

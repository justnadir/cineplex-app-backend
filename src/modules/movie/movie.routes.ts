import { Router } from "express";
import { MovieController } from "./movie.controller";
import { writeLimiter } from "../../middlewares/rate-limiter.middleware";
import fileUploadHandler from "../../middlewares/file-upload.middleware";
import { attachSingleFile } from "../../middlewares/uploaded-file-processor.middleware";
import validateRequest from "../../middlewares/request-validator.middleware";
import { MovieValidator } from "./movie.validation";
import { AuthMiddleware } from "../../middlewares/authentication-middlware";
import { USER_ROLES } from "../../enums";
import { validIdParamCheckSchema } from "../../validators";

export class MovieRoutes {
  public router: Router;
  private movieController: MovieController;
  private validator: MovieValidator;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.movieController = new MovieController();
    this.validator = new MovieValidator();
    this.authMiddleware = new AuthMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      "/create-movie",
      writeLimiter,
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
      fileUploadHandler(),
      attachSingleFile("movie_poster"),
      validateRequest(this.validator.createMovieValidatorSchema),
      this.movieController.create
    );
    this.router.get(
      "/public-movies",
      validateRequest(this.validator.listMovieQueryValidatorSchema),
      this.movieController.retrieve
    );

    this.router
      .route("/:id")
      .patch(
        writeLimiter,
        fileUploadHandler(),
        attachSingleFile("movie_poster"),
        validateRequest(this.validator.updateMovieValidatorSchema),
        this.movieController.update
      )
      .delete(
        writeLimiter,
        this.authMiddleware.authenticate,
        this.authMiddleware.authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
        validateRequest(validIdParamCheckSchema),
        this.movieController.delete
      );
  }
}

export default new MovieRoutes().router;

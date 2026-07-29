import { Router } from "express";
import { TheaterController } from "./theater.controller";
import { writeLimiter } from "../../middlewares/rate-limiter.middleware";
import validateRequest from "../../middlewares/request-validator.middleware";
import { TheaterValidator } from "./theater.validation";

export class TheaterRoutes {
  public router: Router;
  private controller: TheaterController;
  private validator: TheaterValidator;

  constructor() {
    this.router = Router();
    this.controller = new TheaterController();
    this.validator = new TheaterValidator();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router
      .route("/")
      .post(
        writeLimiter,
        validateRequest(this.validator.createTheaterZodSchema),
        this.controller.create
      )
      .get(
        validateRequest(this.validator.theatersQuerySchema),
        this.controller.retrieve
      );
    this.router
      .route("/admin")
      .get(
        validateRequest(this.validator.adminTheatersQuerySchema),
        this.controller.adminRetrieve
      );

    this.router
      .route("/:id")
      .get(
        validateRequest(this.validator.theaterIdParamsSchema),
        this.controller.getSingle
      )
      .patch(
        writeLimiter,
        validateRequest(this.validator.updateTheaterZodSchema),
        this.controller.update
      )
      .delete(
        writeLimiter,
        validateRequest(this.validator.theaterIdParamsSchema),
        this.controller.delete
      );
  }
}

export default new TheaterRoutes().router;

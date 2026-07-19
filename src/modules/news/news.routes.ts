import { Router } from "express";
import { NewsController } from "./news.controller";
import {
    createNewsZodSchema,
    updateNewsZodSchema,
    publicNewsQuerySchema,
    adminNewsQuerySchema,
} from "./news.validation";
import { writeLimiter } from "../../middlewares/rate-limiter.middleware";
import fileUploadHandler from "../../middlewares/file-upload.middleware";
import { attachSingleFile } from "../../middlewares/uploaded-file-processor.middleware";
import validateRequest from "../../middlewares/request-validator.middleware";
import { validIdParamCheckSchema } from "../../validators";

export class NewsRoutes {
    public router: Router;
    private newsController: NewsController;

    constructor() {
        this.router = Router();
        this.newsController = new NewsController();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // GET routes public; create/update/delete admin-only.

        this.router
            .route("/")
            .post(
                writeLimiter,
                fileUploadHandler(),
                attachSingleFile("news_image"),
                validateRequest(createNewsZodSchema),
                this.newsController.create
            )
            .get(
                validateRequest(publicNewsQuerySchema),
                this.newsController.retrieve
            );
        this.router
            .route("/admin")
            .get(validateRequest(adminNewsQuerySchema), this.newsController.retrieve);

        this.router
            .route("/:id")
            .get(
                validateRequest(validIdParamCheckSchema),
                this.newsController.getSingle
            )
            .patch(
                writeLimiter,
                fileUploadHandler(),
                attachSingleFile("news_image"),
                validateRequest(updateNewsZodSchema),
                this.newsController.update
            )
            .delete(
                writeLimiter,
                validateRequest(validIdParamCheckSchema),
                this.newsController.delete
            );
    }
}

export default new NewsRoutes().router;

import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { MovieService } from "./movie.service";

export class MovieController {
  private movieService: MovieService;

  constructor() {
    this.movieService = new MovieService();
  }

  create = catchAsync(async (req: Request, res: Response) => {
    const result = await this.movieService.createToDB({
      ...req.body,
      admin_id: req.user?.user_id,
    });

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Movie created successfully",
      data: result,
    });
  });

  retrieve = catchAsync(async (req: Request, res: Response) => {
    const result = await this.movieService.retrieveFromDB(req.query);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Movie retrieved successfully",
      data: result.movies,
      meta: result.pagination,
    });
  });

  getSingle = catchAsync(async (req: Request, res: Response) => {
    const result = await this.movieService.getByIdFromDB(
      req.params.id as string
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Movie retrieved successfully",
      data: result,
    });
  });

  update = catchAsync(async (req: Request, res: Response) => {
    const result = await this.movieService.updateToDB(
      req.params.id as string,
      req.body
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Movie updated successfully",
      data: result,
    });
  });

  delete = catchAsync(async (req: Request, res: Response) => {
    await this.movieService.deleteFromDB(req.params.id as string);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Movie deleted successfully",
    });
  });
}

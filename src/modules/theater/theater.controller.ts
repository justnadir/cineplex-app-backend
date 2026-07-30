import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { TheaterService } from "./theater.service";

export class TheaterController {
  private theaterService = new TheaterService();

  create = catchAsync(async (req: Request, res: Response) => {
    const result = await this.theaterService.createToDB({
      ...req.body,
      admin_id: req.user?.user_id,
    });
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Theater created successfully",
      data: result,
    });
  });

  retrieve = catchAsync(async (req: Request, res: Response) => {
    const result = await this.theaterService.retrieveFromDB(req.query);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Theaters retrieved successfully",
      data: result.theaters,
      meta: result.pagination,
    });
  });

  adminRetrieve = catchAsync(async (req: Request, res: Response) => {
    const result = await this.theaterService.adminRetrieveFromDB(req.query);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Theaters retrieved successfully",
      data: result.theaters,
      meta: result.pagination,
    });
  });

  getSingle = catchAsync(async (req: Request, res: Response) => {
    const result = await this.theaterService.getByIdFromDB(
      req.params.id as string
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Theater retrieved successfully",
      data: result,
    });
  });

  update = catchAsync(async (req: Request, res: Response) => {
    const result = await this.theaterService.updateToDB(
      req.params.id as string,
      req.body
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Theater updated successfully",
      data: result,
    });
  });

  delete = catchAsync(async (req: Request, res: Response) => {
    await this.theaterService.deleteFromDB(req.params.id as string);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Theater deactivated successfully",
    });
  });
}

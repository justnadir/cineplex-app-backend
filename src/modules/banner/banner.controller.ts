import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { BannerService } from "./banner.service";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";

export class BannerController {
  private bannerService: BannerService;

  constructor() {
    this.bannerService = new BannerService();
  }

  create = catchAsync(async (req: Request, res: Response) => {
    const result = await this.bannerService.createToDB(req.body);

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Banner created successfully",
      data: result,
    });
  });

  retrieve = catchAsync(async (_req: Request, res: Response) => {
    const result = await this.bannerService.retrieveFromDB();

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Banner retrieved successfully",
      data: result,
    });
  });

  update = catchAsync(async (req: Request, res: Response) => {
    const result = await this.bannerService.updateToDB(
      req.params.id as string,
      req.body
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Banner updated successfully",
      data: result,
    });
  });

  delete = catchAsync(async (req: Request, res: Response) => {
    await this.bannerService.deleteFromDB(req.params.id as string);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Banner deleted successfully",
    });
  });
}

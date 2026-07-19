import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { NewsService } from "./news.service";
import getDeviceInfo from "../../utils/getDeviceInfo";
import { getClientIp, getLocationFromIp } from "../../utils/getLocationFromIp";

export class NewsController {
  private newsService: NewsService;

  constructor() {
    this.newsService = new NewsService();
  }

  create = catchAsync(async (req: Request, res: Response) => {
    const result = await this.newsService.createToDB(req.body);

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "News created successfully",
      data: result,
    });
  });

  retrieve = catchAsync(async (req: Request, res: Response) => {
    const userAgent = req.headers["user-agent"] || "";
    const deviceInfo = getDeviceInfo(userAgent);
    const ip = getClientIp(req);
    const location = getLocationFromIp("72.167.221.185");
    console.log(location);
    console.log(ip);
    console.log(deviceInfo);
    const result = await this.newsService.retrieveFromDB(req.query);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "News retrieved successfully",
      data: result.news,
      meta: result.pagination,
    });
  });

  getSingle = catchAsync(async (req: Request, res: Response) => {
    const result = await this.newsService.getByIdFromDB(
      req.params.id as string
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "News retrieved successfully",
      data: result,
    });
  });

  update = catchAsync(async (req: Request, res: Response) => {
    const result = await this.newsService.updateToDB(
      req.params.id as string,
      req.body
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "News updated successfully",
      data: result,
    });
  });

  delete = catchAsync(async (req: Request, res: Response) => {
    await this.newsService.deleteFromDB(req.params.id as string);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "News deleted successfully",
    });
  });
}

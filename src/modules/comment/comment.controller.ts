import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { CommentService } from "./comment.service";

export class CommentController {
  private commentService: CommentService;

  constructor() {
    this.commentService = new CommentService();
  }

  create = catchAsync(async (req: Request, res: Response) => {
    const result = await this.commentService.createToDB(req.body);

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Comment created successfully",
      data: result,
    });
  });

  // PUBLIC: approved comments only, limited fields (nick_name, content, created_at)
  retrievePublic = catchAsync(async (req: Request, res: Response) => {
    const result = await this.commentService.retrievePublicFromDB(
      req.query,
      Number(req.params.id)
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Comments retrieved successfully",
      data: result.comments,
      meta: result.pagination,
    });
  });

  // ADMIN: all comments, all fields, all statuses
  retrieveAll = catchAsync(async (req: Request, res: Response) => {
    const result = await this.commentService.retrieveAllFromDB(
      Number(req.params.id),
      req.query
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Comments retrieved successfully",
      data: result.comments,
      meta: result.pagination,
    });
  });

  moderate = catchAsync(async (req: Request, res: Response) => {
    const result = await this.commentService.moderateInDB(
      req.params.id as string,
      req.body.status
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Comment status updated successfully",
      data: result,
    });
  });
}

import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { UserService } from "./user.service";

export class UserController {
  private userService = new UserService();

  create = catchAsync(async (req: Request, res: Response) => {
    await this.userService.createUserToDB(req.body);
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message:
        "Your account has been successfully created. Verify Your Email By OTP. Check your email inbox for the OTP.",
    });
  });

  retrieveProfile = catchAsync(async (req: Request, res: Response) => {
    const result = await this.userService.retrivedProfileFromDB(
      Number(req?.user?.user_id)
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Profile retrieved",
      data: result,
    });
  });

  changePassword = catchAsync(async (req: Request, res: Response) => {
    const result = await this.userService.changePassword(
      Number(req?.user?.user_id),
      req.body
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Password Change successfully",
      data: result,
    });
  });
}

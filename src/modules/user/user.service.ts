import { StatusCodes } from "http-status-codes";
import ApiError from "../../errors/ApiErrors";
import { UserRepository } from "./user.repository";
import { IChangePassowrd, ICreateUser, IUser } from "./user.interface";
import { OTP_PURPOSE } from "../../enums";
import { OtpGeneratorService } from "../../utils/otp";
import { OtpRepository } from "../otp/otp.repository";
import { HashPasswordService } from "../../utils/hash_password";
import { runInTransaction } from "../../db/transaction-context";
import pool from "../../db";
import { emailQueue } from "../../shared/email/email.queue";

export class UserService {
  private userRepository = new UserRepository();
  private otpGenerator = new OtpGeneratorService();
  private hashPasswordService = new HashPasswordService();
  private otpRepository = new OtpRepository();

  // Create a new user in the database, ensuring uniqueness by email
  async createUserToDB(
    payload: ICreateUser & { password_hash: string }
  ): Promise<IUser | undefined> {
    const existing = await this.userRepository.uniqueByEmail(payload.email);
    if (existing) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        "Email is taken. Please choose a different email."
      );
    }

    const user = await runInTransaction(pool, async () => {
      const createdUser = await this.userRepository.create(payload);

      if (!createdUser) {
        throw new ApiError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          "Failed to create user"
        );
      }

      const otp = this.otpGenerator.generateOTP();
      const otpHash = this.otpGenerator.hashOtp(otp.toString());

      await this.otpRepository.create({
        user_id: createdUser.id,
        otp_hash: otpHash,
        purpose: OTP_PURPOSE.VERIFY_EMAIL,
      });

      return { createdUser, otp };
    });

    await emailQueue.add("otp-verification", {
      to: payload.email,
      subject: "Verify your Cineplex Account",
      template: "welcome",
      context: { name: payload.name, otp: user?.otp },
    });

    return user?.createdUser;
  }

  // update password
  async changePassword(
    user_id: number,
    payload: IChangePassowrd
  ): Promise<IUser> {
    const isValidEmail = await this.userRepository.findByUserId(user_id);
    if (!isValidEmail) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        "You haven't permission to change the password."
      );
    }

    //current password match
    if (
      payload.current_password &&
      !(await this.hashPasswordService.verify(
        isValidEmail.password_hash,
        payload.current_password
      ))
    ) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Password is incorrect");
    }

    //newPassword and current password
    if (payload.current_password === payload.new_password) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Please give different password from current password"
      );
    }

    //new password and confirm password check
    if (payload.new_password !== payload.confirm_password) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Password and Confirm password doesn't matched"
      );
    }

    //hash password
    const password_hash = await this.hashPasswordService.hash(
      payload.new_password
    );

    const updatePassword = await this.userRepository.updatePasswordToDB(
      user_id,
      password_hash
    );
    if (!updatePassword) {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to update Password."
      );
    }

    return isValidEmail;
  }

  // retrived profile information.
  async retrivedProfileFromDB(user_id: number): Promise<IUser | undefined> {
    return await this.userRepository.findByUserId(user_id);
  }
}

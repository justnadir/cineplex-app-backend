import { StatusCodes } from "http-status-codes";
import ApiError from "../../errors/ApiErrors";
import { UserRepository } from "../user/user.repository";
import { ILoginInput, IResetPassword } from "./auth.interface";
import { IUser } from "../user/user.interface";
import { TokenService } from "../../utils/token";
import { HashPasswordService } from "../../utils/hash_password";
import { RefreshTokenRepository } from "../refresh_token/refresh_token.repository";
import { OtpGeneratorService } from "../../utils/otp";
import { OTP_PURPOSE } from "../../enums";
import { PasswordResetRepository } from "../verification_token/verification_token.repository";
import { ICreateOtp, IOtp, IResendOtp } from "../otp/otp.interface";
import { OtpRepository } from "../otp/otp.repository";

export class AuthService {
  private userRepository = new UserRepository();
  private tokenService = new TokenService();
  private hashPasswordService = new HashPasswordService();
  private refreshTokenRepository = new RefreshTokenRepository();
  private passwordResetRepository = new PasswordResetRepository();
  private otpGenerator = new OtpGeneratorService();
  private otpRepository = new OtpRepository();
  private token = this.tokenService.generateResetToken();

  private async handleResetTokenIntoDB(user_id: number, purpose: OTP_PURPOSE) {
    switch (purpose) {
      case OTP_PURPOSE.VERIFY_EMAIL:
        await this.userRepository.updateEmailVerified(user_id);
        return null;
      case OTP_PURPOSE.VERIFY_PHONE:
        await this.userRepository.updatePhoneVerificationToDB(user_id);
        return null;
      case OTP_PURPOSE.DELETE_ACCOUNT:
        await this.userRepository.deleteAccount(user_id);
        return null;

      case OTP_PURPOSE.RECOVERY_ACCOUNT:
        await this.userRepository.recoverAccount(user_id);
        return null;

      case OTP_PURPOSE.FORGOT_PASSWORD:
        await this.passwordResetRepository.insertToDB({
          user_id,
          token_hash: this.tokenService.hash(this.token),
          purpose,
        });
        return this.token;

      default:
        throw new ApiError(StatusCodes.BAD_REQUEST, "Unsupported OTP purpose");
    }
  }

  async login(payload: ILoginInput) {
    // Check if a user exists with this email
    const isValidEmail: IUser | undefined =
      await this.userRepository.findByEmail(payload.email);
    if (!isValidEmail)
      throw new ApiError(StatusCodes.NOT_FOUND, "Invalid Email");

    // check password is correct or not.
    const isValidPassword = await this.hashPasswordService.verify(
      isValidEmail.password_hash,
      payload.password
    );
    if (!isValidPassword)
      throw new ApiError(StatusCodes.FORBIDDEN, "Invalid email and password.");

    // Check if the user's email/account is verified and active
    if (isValidEmail?.is_email_verified === false)
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "Please verify your email before logging in."
      );

    // Check if the account status is inactive
    if (isValidEmail?.status === "inactive")
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "Your account is not active. Please contact support."
      );

    // Check if the account has been banned
    if (isValidEmail?.status === "banned")
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "Your account has been banned. Please contact support for more information."
      );

    // Check if the account has been deleted (30-day recovery window)
    if (isValidEmail?.status === "deleted") {
      const recoveryDeadline = new Date(isValidEmail.deleted_at);
      recoveryDeadline.setDate(recoveryDeadline.getDate() + 30);

      if (new Date() <= recoveryDeadline) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Your account was deleted. You can recover it within 30 days."
        );
      }
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "This account no longer exists"
      );
    }

    const isValidLimit =
      await this.refreshTokenRepository.countValidTokensByUserId(
        isValidEmail.id as number
      );
    if (isValidLimit >= 3) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Device limit");
    }

    const accessToken = this.tokenService.generateAccessToken({
      user_id: isValidEmail.id,
      role: isValidEmail.role,
    });
    const refreshToken = await this.tokenService.generateRefreshToken({
      ...payload,
      user_id: isValidEmail.id,
      role: isValidEmail.role,
    });
    const csrfToken = this.tokenService.csrfToken();

    return { accessToken, refreshToken, csrfToken };
  }

  async forgotPassword(email: string): Promise<IUser> {
    const otp = this.otpGenerator.generateOTP() as number;

    const isExisting = await this.userRepository.findByEmail(email);
    if (!isExisting) {
      throw new ApiError(StatusCodes.CONFLICT, "Invalid Email");
    }
    console.log(otp);

    const otpPayload = {
      user_id: isExisting.id,
      otp_hash: this.otpGenerator.hashOtp(otp.toString()),
      purpose: OTP_PURPOSE.FORGOT_PASSWORD,
    };
    await this.otpRepository.create(otpPayload);
    return isExisting;
  }

  async resetPassword(payload: IResetPassword) {
    const token_hash = this.tokenService.hash(payload.token);
    const isValid = await this.passwordResetRepository.findByToken(
      token_hash,
      "forgot_password"
    );
    if (!isValid) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid Token");
    }

    if (isValid?.purpose !== "forgot_password") {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        "You haven't permission to do this."
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
      isValid.user_id,
      password_hash
    );
    await this.passwordResetRepository.markAsUsed(isValid.id);
    if (!updatePassword) {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to update Password."
      );
    }

    return null;
  }

  // Create a new OTP in the database
  async createOtpToDB(payload: ICreateOtp): Promise<IOtp | undefined> {
    console.log(payload);
    const otp = await this.otpRepository.create(payload);
    return otp;
  }

  // Create a new OTP in the database
  async verifyOtpFromDB(
    email: string,
    otp: number,
    purpose: OTP_PURPOSE
  ): Promise<string | null> {
    const isValidUser = await this.userRepository.findByEmail(email);
    if (!isValidUser) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "You are not valid User.");
    }

    const otpRecord = await this.otpRepository.findLatestOtp(
      isValidUser.id,
      purpose
    );

    // check the otp is exist or not;
    if (!otpRecord) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Invalid OTP");
    }

    // check the otp is expired or not;
    if (new Date() > otpRecord.expires_at) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "OTP expired");
    }

    // Attempts limit check
    if (otpRecord.attempts >= otpRecord.max_attempts) {
      throw new ApiError(StatusCodes.TOO_MANY_REQUESTS, "Too many attempts");
    }

    const isValid = this.otpGenerator.verifyOtp(
      otp.toString(),
      otpRecord.otp_hash
    );
    if (!isValid) {
      await this.otpRepository.incrementAttempts(otpRecord.id); // attempts: 0 → 1
      throw new ApiError(400, "Invalid OTP");
    }

    // masked as used
    await this.otpRepository.markAsUsed(otpRecord.id);
    return await this.handleResetTokenIntoDB(isValidUser.id, purpose);
  }

  // Create a new OTP in the database
  async resentOtpToDB(payload: IResendOtp): Promise<IOtp | undefined> {
    const otp = this.otpGenerator.generateOTP() as number;
    const userExist = await this.userRepository.findByEmail(payload.email);

    const otpPayload = {
      user_id: userExist?.id as number,
      otp_hash: this.otpGenerator.hashOtp(otp.toString()),
      purpose: payload.purpose,
    };

    const newOtp = await this.otpRepository.create(otpPayload);
    return newOtp;
  }

  async deleteAccount(user_id: number): Promise<IUser> {
    const otp = this.otpGenerator.generateOTP() as number;

    const isExisting = await this.userRepository.findByUserId(Number(user_id));
    if (!isExisting) {
      throw new ApiError(StatusCodes.CONFLICT, "Invalid Email");
    }
    console.log(otp);

    const otpPayload = {
      user_id: isExisting.id,
      otp_hash: this.otpGenerator.hashOtp(otp.toString()),
      purpose: OTP_PURPOSE.DELETE_ACCOUNT,
    };
    await this.otpRepository.create(otpPayload);
    return isExisting;
  }

  async recoveryAccount(email: string): Promise<IUser> {
    const otp = this.otpGenerator.generateOTP() as number;

    const isExisting = await this.userRepository.findByEmail(email);
    if (!isExisting) {
      throw new ApiError(StatusCodes.CONFLICT, "Invalid Email");
    }

    if (isExisting.status === "deleted") {
      throw new ApiError(StatusCodes.CONFLICT, "Invalid Email");
    }
    console.log(otp);

    const otpPayload = {
      user_id: isExisting.id,
      otp_hash: this.otpGenerator.hashOtp(otp.toString()),
      purpose: OTP_PURPOSE.RECOVERY_ACCOUNT,
    };
    await this.otpRepository.create(otpPayload);
    return isExisting;
  }
}

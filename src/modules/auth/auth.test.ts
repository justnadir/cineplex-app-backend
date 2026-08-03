import { StatusCodes } from "http-status-codes";
import ApiError from "../../errors/ApiErrors";
import { OTP_PURPOSE } from "../../enums";

jest.mock("../user/user.repository", () => ({
  UserRepository: jest.fn(),
}));

jest.mock("../../utils/token", () => ({
  TokenService: jest.fn(),
}));

jest.mock("../../utils/hash_password", () => ({
  HashPasswordService: jest.fn(),
}));

jest.mock("../refresh_token/refresh_token.repository", () => ({
  RefreshTokenRepository: jest.fn(),
}));

jest.mock("../verification_token/verification_token.repository", () => ({
  PasswordResetRepository: jest.fn(),
}));

jest.mock("../../utils/otp", () => ({
  OtpGeneratorService: jest.fn(),
}));

jest.mock("../otp/otp.repository", () => ({
  OtpRepository: jest.fn(),
}));

import { AuthService } from "./auth.service";
import { UserRepository } from "../user/user.repository";
import { TokenService } from "../../utils/token";
import { HashPasswordService } from "../../utils/hash_password";
import { RefreshTokenRepository } from "../refresh_token/refresh_token.repository";
import { PasswordResetRepository } from "../verification_token/verification_token.repository";
import { OtpGeneratorService } from "../../utils/otp";
import { OtpRepository } from "../otp/otp.repository";

const MockUserRepository = UserRepository as unknown as jest.Mock;
const MockTokenService = TokenService as unknown as jest.Mock;
const MockHashPasswordService = HashPasswordService as unknown as jest.Mock;
const MockRefreshTokenRepository =
  RefreshTokenRepository as unknown as jest.Mock;
const MockPasswordResetRepository =
  PasswordResetRepository as unknown as jest.Mock;
const MockOtpGeneratorService = OtpGeneratorService as unknown as jest.Mock;
const MockOtpRepository = OtpRepository as unknown as jest.Mock;

describe("AuthService", () => {
  let authService: AuthService;
  let mockUserRepo: {
    findByEmail: jest.Mock;
    updateEmailVerified: jest.Mock;
    updatePhoneVerificationToDB: jest.Mock;
    deleteAccount: jest.Mock;
    recoverAccount: jest.Mock;
    updatePasswordToDB: jest.Mock;
    findByUserId: jest.Mock;
  };
  let mockTokenService: {
    generateResetToken: jest.Mock;
    hash: jest.Mock;
    generateAccessToken: jest.Mock;
    generateRefreshToken: jest.Mock;
    csrfToken: jest.Mock;
  };
  let mockHashPasswordService: {
    verify: jest.Mock;
    hash: jest.Mock;
  };
  let mockRefreshTokenRepo: {
    countValidTokensByUserId: jest.Mock;
  };
  let mockPasswordResetRepo: {
    insertToDB: jest.Mock;
    findByToken: jest.Mock;
    markAsUsed: jest.Mock;
  };
  let mockOtpGenerator: {
    generateOTP: jest.Mock;
    hashOtp: jest.Mock;
    verifyOtp: jest.Mock;
  };
  let mockOtpRepo: {
    create: jest.Mock;
    findLatestOtp: jest.Mock;
    incrementAttempts: jest.Mock;
    markAsUsed: jest.Mock;
  };

  const sampleUser = {
    id: 1,
    email: "user@example.com",
    password_hash: "hash",
    role: "USER",
    is_email_verified: true,
    status: "active",
    deleted_at: new Date(),
  };

  beforeEach(() => {
    mockUserRepo = {
      findByEmail: jest.fn(),
      updateEmailVerified: jest.fn(),
      updatePhoneVerificationToDB: jest.fn(),
      deleteAccount: jest.fn(),
      recoverAccount: jest.fn(),
      updatePasswordToDB: jest.fn(),
      findByUserId: jest.fn(),
    };

    mockTokenService = {
      generateResetToken: jest.fn().mockReturnValue("reset-token"),
      hash: jest.fn((value: string) => `hashed:${value}`),
      generateAccessToken: jest.fn().mockReturnValue("access-token"),
      generateRefreshToken: jest.fn().mockResolvedValue("refresh-token"),
      csrfToken: jest.fn().mockReturnValue("csrf-token"),
    };

    mockHashPasswordService = {
      verify: jest.fn(),
      hash: jest.fn(),
    };

    mockRefreshTokenRepo = {
      countValidTokensByUserId: jest.fn(),
    };

    mockPasswordResetRepo = {
      insertToDB: jest.fn(),
      findByToken: jest.fn(),
      markAsUsed: jest.fn(),
    };

    mockOtpGenerator = {
      generateOTP: jest.fn().mockReturnValue(123456),
      hashOtp: jest.fn((value: string) => `otp:${value}`),
      verifyOtp: jest.fn(),
    };

    mockOtpRepo = {
      create: jest.fn(),
      findLatestOtp: jest.fn(),
      incrementAttempts: jest.fn(),
      markAsUsed: jest.fn(),
    };

    MockUserRepository.mockImplementation(() => mockUserRepo);
    MockTokenService.mockImplementation(() => mockTokenService);
    MockHashPasswordService.mockImplementation(() => mockHashPasswordService);
    MockRefreshTokenRepository.mockImplementation(() => mockRefreshTokenRepo);
    MockPasswordResetRepository.mockImplementation(() => mockPasswordResetRepo);
    MockOtpGeneratorService.mockImplementation(() => mockOtpGenerator);
    MockOtpRepository.mockImplementation(() => mockOtpRepo);

    authService = new AuthService();
  });

  describe("login", () => {
    it("should log in a valid user", async () => {
      mockUserRepo.findByEmail.mockResolvedValue(sampleUser);
      mockHashPasswordService.verify.mockResolvedValue(true);
      mockRefreshTokenRepo.countValidTokensByUserId.mockResolvedValue(0);

      const result = await authService.login({
        email: "user@example.com",
        password: "secret",
        user_id: 1,
        token_hash: "hash",
        device_info: "device",
        ip_address: "127.0.0.1",
        city: "Dhaka",
      });

      expect(result).toEqual({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        csrfToken: "csrf-token",
      });
    });

    it("should throw 404 for an invalid email", async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({
          email: "missing@example.com",
          password: "secret",
          user_id: 1,
          token_hash: "hash",
          device_info: "device",
          ip_address: "127.0.0.1",
          city: "Dhaka",
        })
      ).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        message: "Invalid Email",
      } satisfies Partial<ApiError>);
    });
  });

  describe("forgotPassword", () => {
    it("should create an OTP flow for an existing user", async () => {
      mockUserRepo.findByEmail.mockResolvedValue(sampleUser);
      mockOtpRepo.create.mockResolvedValue({ id: 1 });

      const result = await authService.forgotPassword("user@example.com");

      expect(result).toEqual(sampleUser);
      expect(mockOtpRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: sampleUser.id,
          purpose: OTP_PURPOSE.FORGOT_PASSWORD,
        })
      );
    });
  });

  describe("resetPassword", () => {
    it("should reset the password when token is valid", async () => {
      mockPasswordResetRepo.findByToken.mockResolvedValue({
        id: 10,
        user_id: 1,
        purpose: "forgot_password",
      });
      mockHashPasswordService.hash.mockResolvedValue("new-hash");
      mockUserRepo.updatePasswordToDB.mockResolvedValue(true);

      const result = await authService.resetPassword({
        token: "token",
        new_password: "new-pass",
        confirm_password: "new-pass",
      });

      expect(result).toBeNull();
      expect(mockUserRepo.updatePasswordToDB).toHaveBeenCalledWith(
        1,
        "new-hash"
      );
    });

    it("should throw 400 when passwords do not match", async () => {
      mockPasswordResetRepo.findByToken.mockResolvedValue({
        id: 10,
        user_id: 1,
        purpose: "forgot_password",
      });

      await expect(
        authService.resetPassword({
          token: "token",
          new_password: "new-pass",
          confirm_password: "wrong-pass",
        })
      ).rejects.toMatchObject({
        statusCode: StatusCodes.BAD_REQUEST,
        message: "Password and Confirm password doesn't matched",
      } satisfies Partial<ApiError>);
    });
  });

  describe("verifyOtpFromDB", () => {
    it("should verify a valid OTP and complete the flow", async () => {
      mockUserRepo.findByEmail.mockResolvedValue(sampleUser);
      mockOtpRepo.findLatestOtp.mockResolvedValue({
        id: 3,
        otp_hash: "otp:123456",
        expires_at: new Date(Date.now() + 1000),
        attempts: 0,
        max_attempts: 3,
      });
      mockOtpGenerator.verifyOtp.mockReturnValue(true);
      mockOtpRepo.markAsUsed.mockResolvedValue(undefined);

      const result = await authService.verifyOtpFromDB(
        "user@example.com",
        123456,
        OTP_PURPOSE.FORGOT_PASSWORD
      );

      expect(result).toBe("reset-token");
      expect(mockOtpRepo.markAsUsed).toHaveBeenCalledWith(3);
    });
  });
});

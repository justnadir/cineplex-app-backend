import { StatusCodes } from "http-status-codes";
import ApiError from "../../errors/ApiErrors";
import { TokenService } from "../../utils/token";
import { RefreshTokenRepository } from "../refresh_token/refresh_token.repository";

export class RefreshTokenService {
  private tokenService = new TokenService();
  private refreshTokenRepository = new RefreshTokenRepository();

  async regenerateToken(refreshTokenPayload: string, payload: any) {
    if (!refreshTokenPayload) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid Token");
    }

    const isValidUser =
      this.tokenService.verifyRefreshToken(refreshTokenPayload);

    if (!isValidUser.jti) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid Token");
    }

    const invalidTokenToDB = await this.refreshTokenRepository.findByUserId(
      isValidUser.user_id,
      isValidUser.jti.toString()
    );
    if (!invalidTokenToDB) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid Token");
    }
    const accessToken = this.tokenService.generateAccessToken({
      user_id: isValidUser.user_id,
      role: isValidUser.role,
    });
    const refreshToken = await this.tokenService.generateRefreshToken({
      ...payload,
      user_id: isValidUser.user_id,
      role: isValidUser.role,
    });
    const isDeleted = await this.refreshTokenRepository.deleteToken(
      invalidTokenToDB.id,
      isValidUser.user_id
    );
    if (!isDeleted) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        "Document not found or you do not have permission"
      );
    }

    return { accessToken, refreshToken };
  }

  async revokeToken(token_id: number, user_id: number) {
    const isValidUser = this.refreshTokenRepository.revokedToken(
      token_id,
      user_id
    );
    if (!isValidUser) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid Token");
    }
  }
}

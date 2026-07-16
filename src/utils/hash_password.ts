import argon2 from "argon2";
import ApiError from "../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";

export class HashPasswordService {
  private readonly ARGON2_OPTIONS: argon2.Options = {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  };

  // password hash for the given plain password using argon2id algorithm
  async hash(plainPassword: string): Promise<string> {
    try {
      return await argon2.hash(plainPassword, this.ARGON2_OPTIONS);
    } catch {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Password hashing failed"
      );
    }
  }

  // verify the given plain password against the hashed password
  async verify(
    hashedPassword: string,
    plainPassword: string
  ): Promise<boolean> {
    try {
      return await argon2.verify(hashedPassword, plainPassword);
    } catch {
      return false;
    }
  }
}

import { TheaterRepository } from "./theater.repository";
import { ICreateTheater, ITheater, IUpdateTheater } from "./theater.interface";
import { RedisHelper } from "../../shared/redis/redis.helper";
import ApiError from "../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";
import { IPagination } from "../../types/pagination";
import parseId from "../../shared/parseId";

export class TheaterService {
  private theaterRepository = new TheaterRepository();
  private redisHelper = new RedisHelper();

  async createToDB(adminId: number, data: ICreateTheater) {
    const existing = await this.theaterRepository.findByCode(data.code);
    if (existing) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        "A theater with this code already exists"
      );
    }

    const theater = await this.theaterRepository.create(adminId, data);
    if (!theater) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to create theater");
    }
    return theater;
  }

  async retrieveFromDB(query: Record<string, any>) {
    const cached = await this.redisHelper.hget<{
      theaters: Partial<ITheater>[];
      pagination: IPagination;
    }>("theaters:public", query);
    if (cached) {
      return cached;
    }

    const result = await this.theaterRepository.retrieve(query);
    const ttl = result.theaters.length > 0 ? 3600 : 60;
    await this.redisHelper.hset("theaters:public", query, result, ttl);
    return result;
  }

  async adminRetrieveFromDB(query: Record<string, any>) {
    const cached = await this.redisHelper.hget<{
      theaters: Partial<ITheater>[];
      pagination: IPagination;
    }>("theaters:admin", query);
    if (cached) {
      return cached;
    }

    const result = await this.theaterRepository.adminRetrieve(query);
    const ttl = result.theaters.length > 0 ? 3600 : 60;
    await this.redisHelper.hset("theaters:admin", query, result, ttl);
    return result;
  }

  async getByIdFromDB(id: string) {
    const theaterId = parseId(id, "theater id");
    const theater = await this.theaterRepository.findById(theaterId);
    if (!theater) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Theater not found");
    }
    return theater;
  }

  async updateToDB(id: string, data: IUpdateTheater) {
    const theaterId = parseId(id, "theater id");

    const existing = await this.theaterRepository.findById(theaterId);
    if (!existing) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Theater not found");
    }

    // Code bodlale onno theater-er sathe conflict kina dekhi (nijeke baad diye).
    if (data.code) {
      const byCode = await this.theaterRepository.findByCode(data.code);
      if (byCode && byCode.id !== theaterId) {
        throw new ApiError(
          StatusCodes.CONFLICT,
          "A theater with this code already exists"
        );
      }
    }

    const updated = await this.theaterRepository.update(theaterId, data);
    if (!updated) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to update theater");
    }
    return updated;
  }

  async deleteFromDB(id: string) {
    const theaterId = parseId(id, "theater id");

    const existing = await this.theaterRepository.findById(theaterId);
    if (!existing) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Theater not found");
    }

    const ok = await this.theaterRepository.softDelete(theaterId);
    if (!ok) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Theater is already inactive"
      );
    }

    return await this.redisHelper.keyDelete("theaters:*");
  }
}

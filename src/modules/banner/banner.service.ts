import { StatusCodes } from "http-status-codes";
import { BannerRepository } from "./banner.repository";
import { IBanner, IBannerUpdate, ICreateBanner } from "./banner.interface";
import { RedisHelper } from "../../shared/redis/redis.helper";
import ApiError from "../../errors/ApiErrors";
import parseId from "../../shared/parseId";
import unlinkFile from "../../shared/unlinkFile";
import logger from "../../shared/logger";
import { IPagination } from "../../types/pagination";

export class BannerService {
  private bannerRepository: BannerRepository;
  private redisHelper: RedisHelper;

  constructor() {
    this.bannerRepository = new BannerRepository();
    this.redisHelper = new RedisHelper();
  }

  async createToDB(data: ICreateBanner) {
    // check for duplicate title
    const isExistTitle = await this.bannerRepository.findByTitle(data.title);
    if (isExistTitle) {
      throw new ApiError(StatusCodes.CONFLICT, "Banner title already exists");
    }

    const banner = await this.bannerRepository.create(data);
    if (!banner) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to create banner");
    }
    await this.redisHelper.keyDelete("banners");
    return banner;
  }

  async publicBannerRetrieveFromDB(): Promise<IBanner[]> {
    const cacheKey = "banners";
    const CACHE_TTL = 600; // 10 minutes

    try {
      const cached = await this.redisHelper.get<IBanner[]>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (err) {
      logger.warn({ err }, "Redis get failed, falling back to DB");
    }

    const banners = await this.bannerRepository.publicBannerRetrieve();

    try {
      await this.redisHelper.set(cacheKey, banners, undefined, CACHE_TTL);
    } catch (err) {
      logger.warn({ err }, "Redis set failed");
    }

    return banners;
  }

  async adminBannerRetrieveFromDB(
    query: Partial<IBanner>
  ): Promise<{ banners: IBanner[]; pagination: IPagination }> {
    const CACHE_TTL = 300;

    try {
      const cached = await this.redisHelper.hget<{
        banners: IBanner[];
        pagination: IPagination;
      }>("banners", query);
      if (cached) {
        return cached;
      }
    } catch (err) {
      logger.warn({ err, query }, "Redis hget failed, falling back to DB");
    }

    const banners = await this.bannerRepository.adminBannerRetrieve(query);

    try {
      await this.redisHelper.hset("banners", banners, query, CACHE_TTL);
    } catch (err) {
      logger.warn({ err, query }, "Redis set failed");
    }

    return banners;
  }

  async updateToDB(id: string, data: IBannerUpdate) {
    const bannerId = parseId(id, "banner id");

    // check if banner exists
    const isExistBanner = await this.bannerRepository.findById(bannerId);
    if (!isExistBanner) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Banner not found");
    }

    // check for duplicate title only when a new title is provided (exclude this banner)
    if (data.title) {
      const isExistTitle = await this.bannerRepository.findByTitle(
        data.title,
        bannerId
      );
      if (isExistTitle) {
        throw new ApiError(StatusCodes.CONFLICT, "Banner title already exists");
      }
    }

    // proceed to update
    const updatedBanner = await this.bannerRepository.updateById(
      bannerId,
      data
    );
    if (!updatedBanner) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to update banner");
    }

    // if a new image was uploaded, remove the old file after a successful update
    if (data.banner_image && isExistBanner.banner_image) {
      await unlinkFile(isExistBanner.banner_image);
    }

    await this.redisHelper.keyDelete("banners");
    return updatedBanner;
  }

  async deleteFromDB(id: string) {
    const bannerId = parseId(id, "banner id");

    // check if banner exists
    const isExistBanner = await this.bannerRepository.findById(bannerId);
    if (!isExistBanner) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Banner not found");
    }

    const deleted = await this.bannerRepository.deleteById(bannerId);
    if (!deleted) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Banner not found");
    }

    // remove the image file after the DB row is gone
    if (isExistBanner.banner_image) {
      await unlinkFile(isExistBanner.banner_image);
    }

    await this.redisHelper.keyDelete("banners");
    return deleted;
  }
}

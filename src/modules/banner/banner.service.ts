import { StatusCodes } from "http-status-codes";
import { BannerRepository } from "./banner.repository";
import { IBanner, IBannerUpdate } from "./banner.interface";
import { RedisHelper } from "../../shared/redis/redis.helper";
import ApiError from "../../errors/ApiErrors";
import parseId from "../../shared/parseId";
import unlinkFile from "../../shared/unlinkFile";

export class BannerService {
  private bannerRepository: BannerRepository;
  private redisHelper: RedisHelper;

  constructor() {
    this.bannerRepository = new BannerRepository();
    this.redisHelper = new RedisHelper();
  }

  async createToDB(data: IBanner) {
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

  async retrieveFromDB() {
    const cached = await this.redisHelper.get<IBanner[]>("banners");
    if (cached) {
      return cached;
    }

    const banners = await this.bannerRepository.retrieve();
    await this.redisHelper.set("banners", banners);
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

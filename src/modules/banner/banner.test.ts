import { StatusCodes } from "http-status-codes";
import ApiError from "../../errors/ApiErrors";

jest.mock("./banner.repository", () => ({
  BannerRepository: jest.fn(),
}));
jest.mock("../../shared/redis/redis.helper", () => ({
  RedisHelper: jest.fn(),
}));
jest.mock("../../shared/unlinkFile", () =>
  jest.fn().mockResolvedValue(undefined)
);
jest.mock("../../shared/logger", () => ({
  __esModule: true,
  default: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

import { BannerService } from "./banner.service";
import { BannerRepository } from "./banner.repository";
import { RedisHelper } from "../../shared/redis/redis.helper";
import unlinkFile from "../../shared/unlinkFile";

const MockBannerRepository = BannerRepository as unknown as jest.Mock;
const MockRedisHelper = RedisHelper as unknown as jest.Mock;

describe("BannerService", () => {
  let bannerService: BannerService;
  let mockRepo: {
    create: jest.Mock;
    findByTitle: jest.Mock;
    publicBannerRetrieve: jest.Mock;
    adminBannerRetrieve: jest.Mock;
    findById: jest.Mock;
    updateById: jest.Mock;
    deleteById: jest.Mock;
  };
  let mockRedis: {
    get: jest.Mock;
    set: jest.Mock;
    keyDelete: jest.Mock;
    hget: jest.Mock;
    hset: jest.Mock;
  };

  const sampleBanner = {
    id: 1,
    title: "Summer Sale",
    banner_image: "/banners/summer.png",
  };

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      findByTitle: jest.fn(),
      publicBannerRetrieve: jest.fn(),
      adminBannerRetrieve: jest.fn(),
      findById: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
    };

    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      keyDelete: jest.fn(),
      hget: jest.fn(),
      hset: jest.fn(),
    };

    MockBannerRepository.mockImplementation(() => mockRepo);
    MockRedisHelper.mockImplementation(() => mockRedis);

    bannerService = new BannerService();
  });

  describe("createToDB", () => {
    it("should create a banner when title is unique", async () => {
      mockRepo.findByTitle.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(sampleBanner);

      const result = await bannerService.createToDB({
        title: "Summer Sale",
        banner_image: "/banners/summer.png",
      });

      expect(result).toEqual(sampleBanner);
      expect(mockRepo.create).toHaveBeenCalledWith({
        title: "Summer Sale",
        banner_image: "/banners/summer.png",
      });
      expect(mockRedis.keyDelete).toHaveBeenCalledWith("banners");
    });

    it("should throw 409 if title already exists", async () => {
      mockRepo.findByTitle.mockResolvedValue(sampleBanner);

      await expect(
        bannerService.createToDB({
          title: "Summer Sale",
          banner_image: "/banners/summer.png",
        })
      ).rejects.toMatchObject({
        statusCode: StatusCodes.CONFLICT,
        message: "Banner title already exists",
      } satisfies Partial<ApiError>);

      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });

  describe("publicBannerRetrieveFromDB", () => {
    it("should return cached data without querying DB", async () => {
      const cachedBanners = [
        { title: "Cached Banner", banner_image: "/x.png" },
      ];
      mockRedis.get.mockResolvedValue(cachedBanners);

      const result = await bannerService.publicBannerRetrieveFromDB();

      expect(result).toEqual(cachedBanners);
      expect(mockRepo.publicBannerRetrieve).not.toHaveBeenCalled();
    });

    it("should query DB and cache the result on a cache miss", async () => {
      const freshBanners = [{ title: "Fresh Banner", banner_image: "/x.png" }];
      mockRedis.get.mockResolvedValue(null);
      mockRepo.publicBannerRetrieve.mockResolvedValue(freshBanners);

      const result = await bannerService.publicBannerRetrieveFromDB();

      expect(result).toEqual(freshBanners);
      expect(mockRepo.publicBannerRetrieve).toHaveBeenCalledTimes(1);
      expect(mockRedis.set).toHaveBeenCalledWith(
        "banners",
        freshBanners,
        undefined,
        600
      );
    });
  });

  describe("updateToDB", () => {
    it("should update an existing banner", async () => {
      const updatedBanner = { ...sampleBanner, title: "Winter Sale" };
      mockRepo.findById.mockResolvedValue(sampleBanner);
      mockRepo.findByTitle.mockResolvedValue(null);
      mockRepo.updateById.mockResolvedValue(updatedBanner);

      const result = await bannerService.updateToDB("1", {
        title: "Winter Sale",
      });

      expect(result).toEqual(updatedBanner);
      expect(mockRepo.updateById).toHaveBeenCalledWith(1, {
        title: "Winter Sale",
      });
      expect(mockRedis.keyDelete).toHaveBeenCalledWith("banners");
    });

    it("should throw 404 if banner does not exist", async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        bannerService.updateToDB("999", { title: "New Title" })
      ).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        message: "Banner not found",
      } satisfies Partial<ApiError>);

      expect(mockRepo.updateById).not.toHaveBeenCalled();
    });
  });

  describe("deleteFromDB", () => {
    it("should delete an existing banner and remove its image", async () => {
      mockRepo.findById.mockResolvedValue(sampleBanner);
      mockRepo.deleteById.mockResolvedValue(true);

      const result = await bannerService.deleteFromDB("1");

      expect(result).toBe(true);
      expect(mockRepo.deleteById).toHaveBeenCalledWith(1);
      expect(unlinkFile).toHaveBeenCalledWith("/banners/summer.png");
      expect(mockRedis.keyDelete).toHaveBeenCalledWith("banners");
    });

    it("should throw 404 if banner does not exist", async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(bannerService.deleteFromDB("999")).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        message: "Banner not found",
      } satisfies Partial<ApiError>);

      expect(mockRepo.deleteById).not.toHaveBeenCalled();
    });
  });
});

import { StatusCodes } from "http-status-codes";
import ApiError from "../../errors/ApiErrors";

jest.mock("./news.repository", () => ({
  NewsRepository: jest.fn(),
}));

jest.mock("../../shared/redis/redis.helper", () => ({
  RedisHelper: jest.fn(),
}));

jest.mock("../../shared/unlinkFile", () =>
  jest.fn().mockResolvedValue(undefined)
);

import { NewsService } from "./news.service";
import { NewsRepository } from "./news.repository";
import { RedisHelper } from "../../shared/redis/redis.helper";
import unlinkFile from "../../shared/unlinkFile";

const MockNewsRepository = NewsRepository as unknown as jest.Mock;
const MockRedisHelper = RedisHelper as unknown as jest.Mock;

describe("NewsService", () => {
  let newsService: NewsService;
  let mockRepo: {
    create: jest.Mock;
    findById: jest.Mock;
    retrieve: jest.Mock;
    updateById: jest.Mock;
    deleteById: jest.Mock;
  };

  let mockRedis: {
    get: jest.Mock;
    set: jest.Mock;
    hKeyDelete: jest.Mock;
    hget: jest.Mock;
    hset: jest.Mock;
  };

  const sampleNews = {
    id: 1,
    title: "Breaking News",
    news_image: "/news/breaking.png",
    content: "Some breaking news content",
    user_id: 1,
  };

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      retrieve: jest.fn(),
      findById: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
    };
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      hKeyDelete: jest.fn(),
      hget: jest.fn(),
      hset: jest.fn(),
    };

    MockNewsRepository.mockImplementation(() => mockRepo);
    MockRedisHelper.mockImplementation(() => mockRedis);

    newsService = new NewsService();
  });

  describe("createNews", () => {
    it("should create news successfully", async () => {
      mockRepo.create.mockResolvedValue(sampleNews);

      const result = await newsService.createToDB({
        title: "Breaking News",
        news_image: "/news/breaking.png",
        content: "Some breaking news content",
        user_id: 1,
      });

      expect(result).toEqual(sampleNews);
      expect(mockRepo.create).toHaveBeenCalledWith({
        title: "Breaking News",
        news_image: "/news/breaking.png",
        content: "Some breaking news content",
        user_id: 1,
      });

      expect(mockRedis.hKeyDelete).toHaveBeenCalledWith("news");
    });
  });

  describe("retrieveNews", () => {
    it("should retrieve news successfully", async () => {
      const samplePagination = { page: 1, limit: 10, total: 1 };
      mockRepo.retrieve.mockResolvedValue({
        news: [sampleNews],
        pagination: samplePagination,
      });

      const result = await newsService.retrieveFromDB({});

      expect(result).toEqual({
        news: [sampleNews],
        pagination: samplePagination,
      });
      expect(mockRepo.retrieve).toHaveBeenCalledWith({});
    });
  });

  describe("updateNews", () => {
    it("should update news successfully", async () => {
      mockRepo.findById.mockResolvedValue(sampleNews);
      mockRepo.updateById.mockResolvedValue(sampleNews);

      const result = await newsService.updateToDB("1", {
        title: "Updated News",
      });

      expect(result).toEqual(sampleNews);
      expect(mockRepo.updateById).toHaveBeenCalledWith(1, {
        title: "Updated News",
      });

      expect(mockRedis.hKeyDelete).toHaveBeenCalledWith("news");
      expect(mockRedis.hKeyDelete).toHaveBeenCalledWith("news:1");
    });
  });

  describe("deleteNews", () => {
    it("should delete news successfully", async () => {
      mockRepo.findById.mockResolvedValue(sampleNews);
      mockRepo.deleteById.mockResolvedValue(true);

      const result = await newsService.deleteFromDB("1");

      expect(result).toBe(true);
      expect(mockRepo.deleteById).toHaveBeenCalledWith(1);
      expect(unlinkFile).toHaveBeenCalledWith("/news/breaking.png");
      expect(mockRedis.hKeyDelete).toHaveBeenCalledWith("news");
    });

    it("should throw an error if news not found", async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(newsService.deleteFromDB("999")).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        message: "News not found",
      } satisfies Partial<ApiError>);

      expect(mockRepo.deleteById).not.toHaveBeenCalled();
    });
  });
});

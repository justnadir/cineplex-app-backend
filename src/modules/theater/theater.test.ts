import { StatusCodes } from "http-status-codes";
import ApiError from "../../errors/ApiErrors";

jest.mock("./theater.repository", () => ({
  TheaterRepository: jest.fn(),
}));

jest.mock("../../shared/redis/redis.helper", () => ({
  RedisHelper: jest.fn(),
}));

jest.mock("../../shared/logger", () => ({
  __esModule: true,
  default: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

import { TheaterService } from "./theater.service";
import { TheaterRepository } from "./theater.repository";
import { RedisHelper } from "../../shared/redis/redis.helper";

const MockTheaterRepository = TheaterRepository as unknown as jest.Mock;
const MockRedisHelper = RedisHelper as unknown as jest.Mock;

describe("TheaterService", () => {
  let theaterService: TheaterService;

  let mockRepo: {
    create: jest.Mock;
    retrieve: jest.Mock;
    adminRetrieve: jest.Mock;
    findById: jest.Mock;
    findByCode: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
  };

  let mockRedis: {
    get: jest.Mock;
    set: jest.Mock;
    keyDelete: jest.Mock;
    hget: jest.Mock;
    hset: jest.Mock;
  };

  const sampleTheater = {
    id: 1,
    admin_id: 1,
    name: "Grand Cinema",
    code: "GC001",
    location: "Downtown",
    status: "active",
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      retrieve: jest.fn(),
      adminRetrieve: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      keyDelete: jest.fn(),
      hget: jest.fn(),
      hset: jest.fn(),
    };

    MockTheaterRepository.mockImplementation(() => mockRepo);
    MockRedisHelper.mockImplementation(() => mockRedis);

    theaterService = new TheaterService();
  });

  describe("createToDB", () => {
    it("should create a theater when code is unique", async () => {
      mockRepo.findByCode.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(sampleTheater);

      const result = await theaterService.createToDB({
        admin_id: 1,
        name: "Grand Cinema",
        code: "GC001",
        location: "Downtown",
      });

      expect(result).toEqual(sampleTheater);
      expect(mockRepo.create).toHaveBeenCalledWith({
        admin_id: 1,
        name: "Grand Cinema",
        code: "GC001",
        location: "Downtown",
      });
      expect(mockRedis.keyDelete).toHaveBeenCalledWith("theaters:public");
      expect(mockRedis.keyDelete).toHaveBeenCalledWith("theaters:admin");
    });

    it("should throw an error when code already exists", async () => {
      mockRepo.findByCode.mockResolvedValue(sampleTheater);

      await expect(
        theaterService.createToDB({
          admin_id: 1,
          name: "Grand Cinema",
          code: "GC001",
          location: "Downtown",
        })
      ).rejects.toMatchObject({
        statusCode: StatusCodes.CONFLICT,
        message: "A theater with this code already exists",
      } satisfies Partial<ApiError>);

      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });

  describe("retrieveFromDB", () => {
    it("should retrieve theaters from cache if available", async () => {
      const samplePagination = { page: 1, limit: 10, total: 1 };
      const cachedTheaters = {
        theaters: [sampleTheater],
        pagination: samplePagination,
      };
      mockRedis.hget.mockResolvedValue(cachedTheaters);

      const result = await theaterService.retrieveFromDB({});

      expect(result).toEqual(cachedTheaters);
      expect(mockRepo.retrieve).not.toHaveBeenCalled();
    });

    it("should retrieve theaters from DB and cache them if not in cache", async () => {
      const samplePagination = { page: 1, limit: 10, total: 1 };
      const dbResult = {
        theaters: [sampleTheater],
        pagination: samplePagination,
      };
      mockRedis.hget.mockResolvedValue(null);
      mockRepo.retrieve.mockResolvedValue(dbResult);

      const result = await theaterService.retrieveFromDB({});

      expect(result).toEqual(dbResult);
      expect(mockRepo.retrieve).toHaveBeenCalledWith({});
      expect(mockRedis.hset).toHaveBeenCalledWith(
        "theaters:public",
        {},
        dbResult,
        600
      );
    });
  });

  describe("adminRetrieveFromDB", () => {
    it("should retrieve theaters from cache if available", async () => {
      const samplePagination = { page: 1, limit: 10, total: 1 };
      const cachedTheaters = {
        theaters: [sampleTheater],
        pagination: samplePagination,
      };
      mockRedis.hget.mockResolvedValue(cachedTheaters);

      const result = await theaterService.adminRetrieveFromDB({});

      expect(result).toEqual(cachedTheaters);
      expect(mockRepo.adminRetrieve).not.toHaveBeenCalled();
    });

    it("should retrieve theaters from DB and cache them if not in cache", async () => {
      const samplePagination = { page: 1, limit: 10, total: 1 };
      const dbResult = {
        theaters: [sampleTheater],
        pagination: samplePagination,
      };
      mockRedis.hget.mockResolvedValue(null);
      mockRepo.adminRetrieve.mockResolvedValue(dbResult);

      const result = await theaterService.adminRetrieveFromDB({});

      expect(result).toEqual(dbResult);
      expect(mockRepo.adminRetrieve).toHaveBeenCalledWith({});
      expect(mockRedis.hset).toHaveBeenCalledWith(
        "theaters:admin",
        {},
        dbResult,
        600
      );
    });
  });

  describe("updateTheater", () => {
    it("should update a theater successfully", async () => {
      mockRepo.findById.mockResolvedValue(sampleTheater);
      mockRepo.update.mockResolvedValue(sampleTheater);

      const result = await theaterService.updateToDB("1", {
        name: "Updated Cinema",
      });

      expect(result).toEqual(sampleTheater);
      expect(mockRepo.update).toHaveBeenCalledWith(1, {
        name: "Updated Cinema",
      });
      expect(mockRedis.keyDelete).toHaveBeenCalledWith("theaters:public");
      expect(mockRedis.keyDelete).toHaveBeenCalledWith("theaters:admin");
    });
  });

  describe("softDeleteTheater", () => {
    it("should soft delete a theater successfully", async () => {
      mockRepo.findById.mockResolvedValue(sampleTheater);
      mockRepo.softDelete.mockResolvedValue(true);

      const result = await theaterService.deleteFromDB("1");

      expect(result).toBe(sampleTheater);
      expect(mockRepo.softDelete).toHaveBeenCalledWith(1);
      expect(mockRedis.keyDelete).toHaveBeenCalledWith("theaters:public");
      expect(mockRedis.keyDelete).toHaveBeenCalledWith("theaters:admin");
    });
  });
});

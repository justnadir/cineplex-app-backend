import { StatusCodes } from "http-status-codes";
import ApiError from "../../errors/ApiErrors";
import { COMMENT_STATUS } from "../../enums";

jest.mock("./comment.repository", () => ({
  CommentRepository: jest.fn(),
}));
jest.mock("../../shared/redis/redis.helper", () => ({
  RedisHelper: jest.fn(),
}));

import { CommentService } from "./comment.service";
import { CommentRepository } from "./comment.repository";
import { RedisHelper } from "../../shared/redis/redis.helper";

const MockCommentRepository = CommentRepository as unknown as jest.Mock;
const MockRedisHelper = RedisHelper as unknown as jest.Mock;

describe("CommentService", () => {
  let commentService: CommentService;
  let mockRepo: {
    create: jest.Mock;
    retrievePublic: jest.Mock;
    retrieveAll: jest.Mock;
    findById: jest.Mock;
    updateStatus: jest.Mock;
  };
  let mockRedis: {
    keyDelete: jest.Mock;
    hget: jest.Mock;
    hset: jest.Mock;
  };

  const sampleComment = {
    id: 1,
    news_id: 3,
    nick_name: "John Doe",
    email: "john@example.com",
    content: "This is a sample comment.",
    status: COMMENT_STATUS.APPROVED,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      retrievePublic: jest.fn(),
      retrieveAll: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
    };
    mockRedis = {
      keyDelete: jest.fn(),
      hget: jest.fn(),
      hset: jest.fn(),
    };

    MockCommentRepository.mockImplementation(() => mockRepo);
    MockRedisHelper.mockImplementation(() => mockRedis);

    commentService = new CommentService();
  });

  describe("createToDB", () => {
    it("should create a comment and invalidate comment caches", async () => {
      mockRepo.create.mockResolvedValue(sampleComment);

      const result = await commentService.createToDB({
        news_id: 3,
        nick_name: "John Doe",
        email: "john@example.com",
        content: "This is a sample comment.",
      });

      expect(result).toEqual(sampleComment);
      expect(mockRepo.create).toHaveBeenCalledWith({
        news_id: 3,
        nick_name: "John Doe",
        email: "john@example.com",
        content: "This is a sample comment.",
      });
      expect(mockRedis.keyDelete).toHaveBeenCalledWith("comments*");
    });
  });

  describe("retrievePublicFromDB", () => {
    it("should return cached public comments when available", async () => {
      const cached = {
        comments: [sampleComment],
        pagination: { page: 1, limit: 10, total: 1 },
      };
      mockRedis.hget.mockResolvedValue(cached);

      const result = await commentService.retrievePublicFromDB({}, 3);

      expect(result).toEqual(cached);
      expect(mockRepo.retrievePublic).not.toHaveBeenCalled();
    });

    it("should query the repository and cache public comments when missing", async () => {
      const fresh = {
        comments: [sampleComment],
        pagination: { page: 1, limit: 10, total: 1 },
      };
      mockRedis.hget.mockResolvedValue(null);
      mockRepo.retrievePublic.mockResolvedValue(fresh);

      const result = await commentService.retrievePublicFromDB({}, 3);

      expect(result).toEqual(fresh);
      expect(mockRepo.retrievePublic).toHaveBeenCalledWith({}, 3);
      expect(mockRedis.hset).toHaveBeenCalledWith(
        "comments:public",
        {},
        fresh,
        3600
      );
    });
  });

  describe("retrieveAllFromDB", () => {
    it("should return all comments for admin", async () => {
      const fresh = {
        comments: [sampleComment],
        pagination: { page: 1, limit: 10, total: 1 },
      };
      mockRedis.hget.mockResolvedValue(null);
      mockRepo.retrieveAll.mockResolvedValue(fresh);

      const result = await commentService.retrieveAllFromDB(3, {});

      expect(result).toEqual(fresh);
      expect(mockRepo.retrieveAll).toHaveBeenCalledWith(3, {});
      expect(mockRedis.hset).toHaveBeenCalledWith(
        "comments:admin",
        {},
        fresh,
        3600
      );
    });
  });

  describe("moderateInDB", () => {
    it("should update comment status and invalidate caches", async () => {
      mockRepo.findById.mockResolvedValue(sampleComment);
      mockRepo.updateStatus.mockResolvedValue({
        ...sampleComment,
        status: COMMENT_STATUS.APPROVED,
      });

      const result = await commentService.moderateInDB(
        "1",
        COMMENT_STATUS.APPROVED
      );

      expect(result).toEqual({
        ...sampleComment,
        status: COMMENT_STATUS.APPROVED,
      });
      expect(mockRepo.updateStatus).toHaveBeenCalledWith(
        1,
        COMMENT_STATUS.APPROVED
      );
      expect(mockRedis.keyDelete).toHaveBeenCalledWith("comments*");
    });

    it("should throw 404 if the comment does not exist", async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        commentService.moderateInDB("999", COMMENT_STATUS.APPROVED)
      ).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        message: "Comment not found",
      } satisfies Partial<ApiError>);
    });
  });
});

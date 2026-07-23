import { StatusCodes } from "http-status-codes";
import parseId from "../../shared/parseId";
import { CommentRepository } from "./comment.repository";
import { IComment, ICreateComment } from "./comment.interface";
import { RedisHelper } from "../../shared/redis/redis.helper";
import ApiError from "../../errors/ApiErrors";
import { IPagination } from "../../types/pagination";
import { COMMENT_STATUS } from "../../enums";

export class CommentService {
  private commentRepository: CommentRepository;
  private redisHelper: RedisHelper;

  constructor() {
    this.commentRepository = new CommentRepository();
    this.redisHelper = new RedisHelper();
  }

  async createToDB(data: ICreateComment) {
    const comment = await this.commentRepository.create(data);
    if (!comment) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to create comment");
    }
    // public + admin duita cache namespace-i invalidate kori.
    await this.redisHelper.keyDelete("comments*");
    return comment;
  }

  // PUBLIC: shudhu approved comment, limited field (nick_name, content, created_at).
  async retrievePublicFromDB(
    query: Partial<IComment>,
    id: number
  ): Promise<{ comments: Partial<IComment>[]; pagination: IPagination }> {
    const cached = await this.redisHelper.hget<{
      comments: Partial<IComment>[];
      pagination: IPagination;
    }>("comments:public", query);
    if (cached) {
      return cached;
    }

    const result = await this.commentRepository.retrievePublic(query, id);
    const ttl = result.comments.length > 0 ? 3600 : 60;
    await this.redisHelper.hset("comments:public", query, result, ttl);
    return result;
  }

  // ADMIN: sob comment, sob field, sob status.
  async retrieveAllFromDB(
    id: number,
    query: Partial<IComment>
  ): Promise<{ comments: IComment[]; pagination: IPagination }> {
    const cached = await this.redisHelper.hget<{
      comments: IComment[];
      pagination: IPagination;
    }>("comments:admin", query);
    if (cached) {
      return cached;
    }

    const result = await this.commentRepository.retrieveAll(id, query);
    const ttl = result.comments.length > 0 ? 3600 : 60;
    await this.redisHelper.hset("comments:admin", query, result, ttl);
    return result;
  }

  async moderateInDB(id: string, status: COMMENT_STATUS) {
    const commentId = parseId(id, "comment id");

    const isExistComment = await this.commentRepository.findById(commentId);
    if (!isExistComment) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Comment not found");
    }

    const updated = await this.commentRepository.updateStatus(
      commentId,
      status
    );
    if (!updated) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Failed to update comment status"
      );
    }

    await this.redisHelper.keyDelete("comments*");
    return updated;
  }
}

import { StatusCodes } from "http-status-codes";
import { NewsRepository } from "./news.repository";
import { INews, ICreateNews, INewsUpdate } from "./news.interface";
import { IPagination } from "../../types/pagination";
import ApiError from "../../errors/ApiErrors";
import parseId from "../../shared/parseId";
import unlinkFile from "../../shared/unlinkFile";
import { RedisHelper } from "../../shared/redis/redis.helper";

export class NewsService {
  private newsRepository: NewsRepository;
  private redisHelper: RedisHelper;

  constructor() {
    this.newsRepository = new NewsRepository();
    this.redisHelper = new RedisHelper();
  }

  async createToDB(data: ICreateNews) {
    const news = await this.newsRepository.create(data);
    if (!news) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to create news");
    }
    await this.redisHelper.del("news");
    return news;
  }

  async retrieveFromDB(
    query: Record<string, any>
  ): Promise<{ news: INews[]; pagination: IPagination }> {
    const cached = await this.redisHelper.hget<{
      news: INews[];
      pagination: IPagination;
    }>("news", query);
    if (cached) {
      return cached;
    }

    const result = await this.newsRepository.retrieve(query);
    // Negative caching: empty result o short TTL e rakhi jate same khali query
    // bar bar DB te na jay (thundering herd guard).
    const ttl = result.news.length > 0 ? 3600 : 60;
    await this.redisHelper.hset("news", query, result, ttl);
    return result;
  }

  async getByIdFromDB(id: string) {
    const newsId = parseId(id, "news id");

    const cacheKey = `news:${newsId}`;
    const cached = await this.redisHelper.get<INews>(cacheKey);
    if (cached) {
      return cached;
    }

    const news = await this.newsRepository.findById(newsId);
    if (!news) {
      throw new ApiError(StatusCodes.NOT_FOUND, "News not found");
    }

    await this.redisHelper.set(cacheKey, news, undefined, 3600); // cache 1 hour
    return news;
  }

  async updateToDB(id: string, data: INewsUpdate) {
    const newsId = parseId(id, "news id");

    const isExistNews = await this.newsRepository.findById(newsId);
    if (!isExistNews) {
      throw new ApiError(StatusCodes.NOT_FOUND, "News not found");
    }

    const updatedNews = await this.newsRepository.updateById(newsId, data);
    if (!updatedNews) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to update news");
    }

    // if a new image was uploaded, remove the old file after a successful update
    if (data.news_image && isExistNews.news_image) {
      await unlinkFile(isExistNews.news_image);
    }

    await this.redisHelper.del("news");
    await this.redisHelper.del(`news:${newsId}`);
    return updatedNews;
  }

  async deleteFromDB(id: string) {
    const newsId = parseId(id, "news id");

    const isExistNews = await this.newsRepository.findById(newsId);
    if (!isExistNews) {
      throw new ApiError(StatusCodes.NOT_FOUND, "News not found");
    }

    const deleted = await this.newsRepository.deleteById(newsId);
    if (!deleted) {
      throw new ApiError(StatusCodes.NOT_FOUND, "News not found");
    }

    // remove the image file after the DB row is gone
    if (isExistNews.news_image) {
      await unlinkFile(isExistNews.news_image);
    }

    await this.redisHelper.del("news");
    await this.redisHelper.del(`news:${newsId}`);
    return deleted;
  }
}

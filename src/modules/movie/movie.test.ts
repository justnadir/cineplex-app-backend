import { StatusCodes } from "http-status-codes";
import ApiError from "../../errors/ApiErrors";
import { MOVIE_CATEGORY, MOVIE_STATUS } from "../../enums";

jest.mock("./movie.repository", () => ({
  MovieRepository: jest.fn(),
}));

jest.mock("../../shared/redis/redis.helper", () => ({
  RedisHelper: jest.fn(),
}));

jest.mock("../../shared/unlinkFile", () =>
  jest.fn().mockResolvedValue(undefined)
);

import { MovieService } from "./movie.service";
import { MovieRepository } from "./movie.repository";
import { RedisHelper } from "../../shared/redis/redis.helper";
import unlinkFile from "../../shared/unlinkFile";

const MockMovieRepository = MovieRepository as unknown as jest.Mock;
const MockRedisHelper = RedisHelper as unknown as jest.Mock;

describe("MovieService", () => {
  let movieService: MovieService;
  let mockRepo: {
    findByTitle: jest.Mock;
    create: jest.Mock;
    retrieve: jest.Mock;
    findById: jest.Mock;
    updateById: jest.Mock;
    deleteById: jest.Mock;
  };
  let mockRedis: {
    del: jest.Mock;
    hget: jest.Mock;
    hset: jest.Mock;
  };

  const sampleMovie = {
    id: 1,
    title: "Inception",
    movie_poster: "/movies/inception.png",
    category: MOVIE_CATEGORY["2D"],
    admin_id: "1",
    actor: "Leonardo DiCaprio",
    genre: "Sci-Fi",
    release_date: new Date("2010-07-16"),
    duration: "148 min",
    language: "English",
    synopsis: "A thief enters dreams",
    trailer: "https://example.com/inception",
    status: MOVIE_STATUS.PUBLISHED,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    mockRepo = {
      findByTitle: jest.fn(),
      create: jest.fn(),
      retrieve: jest.fn(),
      findById: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
    };

    mockRedis = {
      del: jest.fn(),
      hget: jest.fn(),
      hset: jest.fn(),
    };

    MockMovieRepository.mockImplementation(() => mockRepo);
    MockRedisHelper.mockImplementation(() => mockRedis);

    movieService = new MovieService();
  });

  describe("createToDB", () => {
    it("should create a movie when title is unique", async () => {
      mockRepo.findByTitle.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(sampleMovie);

      const result = await movieService.createToDB({
        title: "Inception",
        movie_poster: "/movies/inception.png",
        category: MOVIE_CATEGORY["2D"],
        admin_id: "1",
        actor: "Leonardo DiCaprio",
        genre: "Sci-Fi",
        release_date: new Date("2010-07-16"),
        duration: "148 min",
        language: "English",
        synopsis: "A thief enters dreams",
        trailer: "https://example.com/inception",
      });

      expect(result).toEqual(sampleMovie);
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Inception",
        })
      );
      expect(mockRedis.del).toHaveBeenCalledWith("movies");
    });

    it("should throw 409 if title already exists", async () => {
      mockRepo.findByTitle.mockResolvedValue(sampleMovie);

      await expect(
        movieService.createToDB({
          title: "Inception",
          movie_poster: "/movies/inception.png",
          category: MOVIE_CATEGORY["2D"],
          admin_id: "1",
          actor: "Leonardo DiCaprio",
          genre: "Sci-Fi",
          release_date: new Date("2010-07-16"),
          duration: "148 min",
          language: "English",
          synopsis: "A thief enters dreams",
          trailer: "https://example.com/inception",
        })
      ).rejects.toMatchObject({
        statusCode: StatusCodes.CONFLICT,
        message: "Movie title already exists",
      } satisfies Partial<ApiError>);
    });
  });

  describe("retrieveFromDB", () => {
    it("should return cached movie data when available", async () => {
      const cachedResult = {
        movies: [sampleMovie],
        pagination: { page: 1, limit: 10, total: 1 },
      };
      mockRedis.hget.mockResolvedValue(cachedResult);

      const result = await movieService.retrieveFromDB({});

      expect(result).toEqual(cachedResult);
      expect(mockRepo.retrieve).not.toHaveBeenCalled();
    });

    it("should query the repository and cache the result on a miss", async () => {
      const freshResult = {
        movies: [sampleMovie],
        pagination: { page: 1, limit: 10, total: 1 },
      };
      mockRedis.hget.mockResolvedValue(null);
      mockRepo.retrieve.mockResolvedValue(freshResult);

      const result = await movieService.retrieveFromDB({});

      expect(result).toEqual(freshResult);
      expect(mockRepo.retrieve).toHaveBeenCalledWith({});
      expect(mockRedis.hset).toHaveBeenCalledWith(
        "movies",
        {},
        freshResult,
        3600
      );
    });
  });

  describe("getByIdFromDB", () => {
    it("should get a movie by id", async () => {
      mockRepo.findById.mockResolvedValue(sampleMovie);

      const result = await movieService.getByIdFromDB("1");

      expect(result).toEqual(sampleMovie);
      expect(mockRepo.findById).toHaveBeenCalledWith(1);
    });

    it("should throw 404 if the movie does not exist", async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(movieService.getByIdFromDB("999")).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        message: "Movie not found",
      } satisfies Partial<ApiError>);
    });
  });

  describe("updateToDB", () => {
    it("should update a movie successfully", async () => {
      mockRepo.findById.mockResolvedValue(sampleMovie);
      mockRepo.findByTitle.mockResolvedValue(null);
      mockRepo.updateById.mockResolvedValue({
        ...sampleMovie,
        title: "The Matrix",
      });

      const result = await movieService.updateToDB("1", {
        title: "The Matrix",
      });

      expect(result).toEqual({ ...sampleMovie, title: "The Matrix" });
      expect(mockRepo.updateById).toHaveBeenCalledWith(1, {
        title: "The Matrix",
      });
      expect(mockRedis.del).toHaveBeenCalledWith("movies");
    });

    it("should throw 404 if the movie is not found", async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        movieService.updateToDB("999", { title: "Unknown" })
      ).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        message: "Movie not found",
      } satisfies Partial<ApiError>);
    });
  });

  describe("deleteFromDB", () => {
    it("should delete the movie and remove its poster", async () => {
      mockRepo.findById.mockResolvedValue(sampleMovie);
      mockRepo.deleteById.mockResolvedValue(true);

      const result = await movieService.deleteFromDB("1");

      expect(result).toBe(true);
      expect(mockRepo.deleteById).toHaveBeenCalledWith(1);
      expect(unlinkFile).toHaveBeenCalledWith("/movies/inception.png");
      expect(mockRedis.del).toHaveBeenCalledWith("movies");
    });

    it("should throw 404 if the movie does not exist", async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(movieService.deleteFromDB("999")).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        message: "Movie not found",
      } satisfies Partial<ApiError>);
    });
  });
});

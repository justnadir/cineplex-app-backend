import { StatusCodes } from "http-status-codes";
import { IPagination } from "../../types/pagination";
import { MovieRepository } from "./movie.repository";
import { ICreateMovie, IMovie, IMovieUpdate } from "./movie.interface";
import { RedisHelper } from "../../shared/redis/redis.helper";
import ApiError from "../../errors/ApiErrors";
import parseId from "../../shared/parseId";
import unlinkFile from "../../shared/unlinkFile";

export class MovieService {
  private movieRepository: MovieRepository;
  private redisHelper: RedisHelper;

  constructor() {
    this.movieRepository = new MovieRepository();
    this.redisHelper = new RedisHelper();
  }

  async createToDB(data: ICreateMovie) {
    // check for duplicate title
    const isExistTitle = await this.movieRepository.findByTitle(data.title);
    if (isExistTitle) {
      throw new ApiError(StatusCodes.CONFLICT, "Movie title already exists");
    }

    const movie = await this.movieRepository.create(data);
    if (!movie) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to create movie");
    }
    await this.redisHelper.del("movies");
    return movie;
  }

  async retrieveFromDB(query: Record<string, any>) {
    // Caching ekhane (service layer) — read-through + invalidation ek jaygay.
    const cached = await this.redisHelper.hget<{
      movies: IMovie[];
      pagination: IPagination;
    }>("movies", query);
    if (cached) {
      return cached;
    }

    const result = await this.movieRepository.retrieve(query);
    if (result.movies.length > 0) {
      await this.redisHelper.hset("movies", query, result, 3600); // cache 1 hour
    }
    return result;
  }

  async getByIdFromDB(id: string) {
    const movieId = parseId(id, "movie id");

    const movie = await this.movieRepository.findById(movieId);
    if (!movie) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Movie not found");
    }

    return movie;
  }

  async updateToDB(id: string, data: IMovieUpdate) {
    const movieId = parseId(id, "movie id");

    // check if movie exists
    const isExistMovie = await this.movieRepository.findById(movieId);
    if (!isExistMovie) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Movie not found");
    }

    // check for duplicate title only when a new title is provided (exclude this movie)
    if (data.title) {
      const isExistTitle = await this.movieRepository.findByTitle(
        data.title,
        movieId
      );
      if (isExistTitle) {
        throw new ApiError(StatusCodes.CONFLICT, "Movie title already exists");
      }
    }

    // proceed to update
    const updatedMovie = await this.movieRepository.updateById(movieId, data);
    if (!updatedMovie) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to update movie");
    }

    // if a new image was uploaded, remove the old file after a successful update
    if (data.movie_poster && isExistMovie.movie_poster) {
      await unlinkFile(isExistMovie.movie_poster);
    }

    await this.redisHelper.del("movies");
    return updatedMovie;
  }

  async deleteFromDB(id: string) {
    const movieId = parseId(id, "movie id");

    // check if movie exists
    const isExistMovie = await this.movieRepository.findById(movieId);
    if (!isExistMovie) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Movie not found");
    }

    const deleted = await this.movieRepository.deleteById(movieId);
    if (!deleted) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Movie not found");
    }

    // remove the image file after the DB row is gone
    if (isExistMovie.movie_poster) {
      await unlinkFile(isExistMovie.movie_poster);
    }

    await this.redisHelper.del("movies");
    return deleted;
  }
}

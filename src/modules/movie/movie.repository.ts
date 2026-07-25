import pool from "../../db";
import QueryBuilder from "../../shared/QueryBuilder";
import { IPagination } from "../../types/pagination";
import { ICreateMovie, IMovie, IMovieUpdate } from "./movie.interface";

export class MovieRepository {
  private pool = pool;

  async create(payload: ICreateMovie): Promise<IMovie | undefined> {
    const movieResult = await pool.query<IMovie>(
      `INSERT INTO movies (
        movie_poster, title, category, actor, genre, release_date,
        duration, language, synopsis, trailer
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
      `,
      [
        payload.movie_poster,
        payload.title,
        payload.category,
        payload.actor,
        payload.genre,
        payload.release_date,
        payload.duration,
        payload.language,
        payload.synopsis,
        payload.trailer,
      ]
    );

    return movieResult.rows[0];
  }

  async retrieve(
    query: Record<string, any>
  ): Promise<{ movies: IMovie[]; pagination: IPagination }> {
    const builder = new QueryBuilder("movies", query)
      .search(["title", "genre", "actor"]) // ?searchTerm=...
      .filter(["category", "status", "language", "genre"])
      .sort()
      .paginate();

    const movies = await builder.execute<IMovie>();
    const pagination = await builder.getPaginationInfo();

    return { movies, pagination };
  }

  // Retrieve a movie by title (case-insensitive, used to detect duplicates).
  async findByTitle(title: string, excludeId?: number): Promise<IMovie | null> {
    const result = await this.pool.query<IMovie>(
      `SELECT * FROM movies
       WHERE LOWER(TRIM(title)) = LOWER(TRIM($1))
         AND ($2::int IS NULL OR id <> $2)
       LIMIT 1`,
      [title, excludeId ?? null]
    );
    return result.rows[0] ?? null;
  }

  // Retrieve a movie by id
  async findById(id: number): Promise<IMovie | null> {
    const result = await this.pool.query<IMovie>(
      "SELECT * FROM movies WHERE id = $1 LIMIT 1",
      [id]
    );
    return result.rows[0] ?? null;
  }

  // Update a movie by id (only provided fields change; updated_at via trigger)
  async updateById(id: number, payload: IMovieUpdate): Promise<IMovie | null> {
    const result = await this.pool.query<IMovie>(
      `UPDATE movies SET
        movie_poster = COALESCE($1, movie_poster),
        title        = COALESCE($2, title),
        category     = COALESCE($3, category),
        actor        = COALESCE($4, actor),
        genre        = COALESCE($5, genre),
        release_date = COALESCE($6, release_date),
        duration     = COALESCE($7, duration),
        language     = COALESCE($8, language),
        synopsis     = COALESCE($9, synopsis),
        trailer      = COALESCE($10, trailer),
        status       = COALESCE($11, status)
      WHERE id = $12
      RETURNING *
      `,
      [
        payload.movie_poster ?? null,
        payload.title ?? null,
        payload.category ?? null,
        payload.actor ?? null,
        payload.genre ?? null,
        payload.release_date ?? null,
        payload.duration ?? null,
        payload.language ?? null,
        payload.synopsis ?? null,
        payload.trailer ?? null,
        payload.status ?? null,
        id,
      ]
    );
    return result.rows[0] ?? null;
  }

  // Delete a movie by id; returns true if a row was removed
  async deleteById(id: number): Promise<boolean> {
    const result = await this.pool.query(
      "DELETE FROM movies WHERE id = $1 RETURNING id",
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }
}

import pool from "../../db";
import { COMMENT_STATUS } from "../../enums";
import QueryBuilder from "../../shared/QueryBuilder";
import { IPagination } from "../../types/pagination";
import { IComment, ICreateComment } from "./comment.interface";

export class CommentRepository {
  private pool = pool;

  async create(payload: ICreateComment): Promise<IComment | undefined> {
    const result = await pool.query<IComment>(
      `INSERT INTO comments (news_id, nick_name, email, content)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `,
      [payload.news_id, payload.nick_name, payload.email, payload.content]
    );

    return result.rows[0];
  }

  // Public information only (for public listing): approved comments, limited fields.
  private static readonly PUBLIC_FIELDS = [
    "nick_name",
    "content",
    "created_at",
  ];

  async retrievePublic(
    query: Partial<IComment>,
    id: number
  ): Promise<{ comments: Partial<IComment>[]; pagination: IPagination }> {
    const builder = new QueryBuilder("comments", {
      ...query,
      news_id: id,
      status: "approved",
    })
      .select(CommentRepository.PUBLIC_FIELDS)
      .filter(["news_id", "status"])
      .sort()
      .paginate();

    const comments = await builder.execute<Partial<IComment>>();
    const pagination = await builder.getPaginationInfo();

    return { comments, pagination };
  }

  // ADMIN: sob comment, sob field, news_id + status diye filter kora jay.
  async retrieveAll(
    id: number,
    query: Partial<IComment>
  ): Promise<{ comments: IComment[]; pagination: IPagination }> {
    const builder = new QueryBuilder("comments", { ...query, news_id: id })
      .filter(["news_id", "status"])
      .sort()
      .paginate();

    const comments = await builder.execute<IComment>();
    const pagination = await builder.getPaginationInfo();

    return { comments, pagination };
  }

  // Retrieve a single comment by id (for moderation lookups)
  async findById(id: number): Promise<IComment | null> {
    const result = await this.pool.query<IComment>(
      "SELECT * FROM comments WHERE id = $1 LIMIT 1",
      [id]
    );
    return result.rows[0] ?? null;
  }

  // Update a comment's moderation status; returns the updated row (updated_at via trigger)
  async updateStatus(
    id: number,
    status: COMMENT_STATUS
  ): Promise<IComment | null> {
    const result = await this.pool.query<IComment>(
      "UPDATE comments SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );
    return result.rows[0] ?? null;
  }
}

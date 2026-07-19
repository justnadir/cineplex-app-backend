import pool from "../../db";
import { IBanner, IBannerUpdate } from "./banner.interface";

export class BannerRepository {
  private pool = pool;

  async create(payload: IBanner): Promise<IBanner | undefined> {
    const bannerResult = await pool.query<IBanner>(
      `INSERT INTO banners (title, banner_image)
      VALUES ($1, $2)
      RETURNING *
      `,
      [payload.title, payload.banner_image]
    );

    return bannerResult.rows[0];
  }

  // Retrieve all banners ordered by creation date
  async retrieve(): Promise<IBanner[]> {
    const result = await this.pool.query<IBanner>(
      "SELECT * FROM banners ORDER BY created_at ASC, id ASC"
    );
    return result.rows;
  }

  // Retrieve a banner by title (case-insensitive, used to detect duplicates).
  async findByTitle(
    title: string,
    excludeId?: number
  ): Promise<IBanner | null> {
    const result = await this.pool.query<IBanner>(
      `SELECT * FROM banners
       WHERE LOWER(TRIM(title)) = LOWER(TRIM($1))
         AND ($2::int IS NULL OR id <> $2)
       LIMIT 1`,
      [title, excludeId ?? null]
    );
    return result.rows[0] ?? null;
  }

  // Retrieve a banner by id
  async findById(id: number): Promise<IBanner | null> {
    const result = await this.pool.query<IBanner>(
      "SELECT * FROM banners WHERE id = $1 LIMIT 1",
      [id]
    );
    return result.rows[0] ?? null;
  }

  // Update a banner by id (only provided fields change; updated_at via trigger)
  async updateById(
    id: number,
    payload: IBannerUpdate
  ): Promise<IBanner | null> {
    const sql = `
      UPDATE banners SET
        title        = COALESCE($1, title),
        banner_image = COALESCE($2, banner_image)
      WHERE id = $3
      RETURNING *
    `;
    const values = [payload.title ?? null, payload.banner_image ?? null, id];
    const result = await this.pool.query<IBanner>(sql, values);
    return result.rows[0] ?? null;
  }

  // Delete a banner by id; returns true if a row was removed
  async deleteById(id: number): Promise<boolean> {
    const result = await this.pool.query(
      "DELETE FROM banners WHERE id = $1 RETURNING id",
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }
}

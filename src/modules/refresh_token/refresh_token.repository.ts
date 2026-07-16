import pool from "../../db";
import { ICreateRefreshToken, IRefreshToken } from "./refresh_token.interface";

export class RefreshTokenRepository {
  private pool = pool;

  async create(
    payload: ICreateRefreshToken
  ): Promise<IRefreshToken | undefined> {
    const result = await this.pool.query<IRefreshToken>(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, device_info, ip_address, city, jti )
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *
            `,
      [
        payload.user_id,
        payload.token_hash,
        payload.expires_at,
        payload.device_info,
        payload.ip_address,
        payload.city,
        payload.jti,
      ]
    );

    return result.rows[0];
  }

  async findByUserId(
    user_id: number,
    jti: string
  ): Promise<IRefreshToken | null> {
    const result = await this.pool.query<IRefreshToken>(
      "SELECT * FROM refresh_tokens WHERE user_id = $1 AND is_revoked = false AND jti = $2  LIMIT 1",
      [user_id, jti]
    );
    return result.rows[0] ?? null;
  }

  async countValidTokensByUserId(user_id: number): Promise<number> {
    const result = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM refresh_tokens 
            WHERE user_id = $1 
            AND is_revoked = false 
            AND expires_at > NOW()`,
      [user_id]
    );
    return parseInt(result.rows[0]!.count, 10);
  }

  async revokedToken(
    refresh_token_id: number,
    user_id: number
  ): Promise<IRefreshToken | undefined> {
    const result = await this.pool.query<IRefreshToken>(
      `UPDATE refresh_tokens 
            SET is_revoked = true 
            WHERE id = $1 AND user_id = $2
            RETURNING *
            `,
      [refresh_token_id, user_id]
    );
    return result.rows[0];
  }

  async deleteToken(refresh_token_id: number, user_id: number) {
    const result = await this.pool.query<IRefreshToken>(
      `DELETE FROM refresh_tokens 
            WHERE id = $1 AND user_id = $2
            RETURNING *
            `,
      [refresh_token_id, user_id]
    );
    return result.rows[0];
  }
}

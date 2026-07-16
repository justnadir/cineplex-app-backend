import pool from "../../db";
import {
  ICreateVerification_token,
  IVerification_token,
} from "./verification_token.interface";

export class PasswordResetRepository {
  private pool = pool;

  async insertToDB(
    payload: ICreateVerification_token
  ): Promise<IVerification_token | undefined> {
    const expired_at = new Date(Date.now() + 7 * 60 * 1000);
    const result = await this.pool.query<IVerification_token>(
      `INSERT INTO verification_tokens (user_id, token_hash, purpose, expires_at)
             VALUES ($1, $2, $3, $4)
             RETURNING *
            `,
      [payload.user_id, payload.token_hash, payload.purpose, expired_at]
    );

    return result.rows[0];
  }

  async findByToken(
    token_hash: string,
    purpose: string
  ): Promise<IVerification_token | undefined> {
    const result = await this.pool.query<IVerification_token>(
      `SELECT * FROM verification_tokens WHERE token_hash = $1 AND purpose = $2 AND is_used = false LIMIT 1`,
      [token_hash, purpose]
    );

    return result.rows[0];
  }

  async markAsUsed(password_reset_id: number) {
    const result = await this.pool.query(
      `UPDATE verification_tokens
                SET is_used = true 
                WHERE id = $1
                RETURNING *
                `,
      [password_reset_id]
    );

    return result.rows[0];
  }
}

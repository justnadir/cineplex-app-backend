import pool from "../../db";
import { getClient } from "../../db/transaction-context";
import { ICreateOtp, IOtp } from "./otp.interface";

export class OtpRepository {
  private pool = pool;

  async create(payload: ICreateOtp): Promise<IOtp | undefined> {
    const client = getClient(this.pool);

    const expiredAt = new Date(Date.now() + 5 * 60 * 1000);
    const result = await client.query<IOtp>(
      `INSERT INTO otps (user_id, otp_hash, purpose, expires_at)
             VALUES ($1, $2, $3, $4)
             RETURNING *
            `,
      [payload.user_id, payload.otp_hash, payload.purpose, expiredAt]
    );

    return result.rows[0];
  }

  async findLatestOtp(user_id: number, purpose: string): Promise<IOtp | null> {
    const result = await this.pool.query<IOtp>(
      `SELECT * FROM otps
            WHERE user_id = $1 AND purpose = $2 AND is_used = false 
            ORDER BY created_at DESC 
            LIMIT 1
            `,
      [user_id, purpose]
    );

    return result.rows[0] ?? null;
  }

  async incrementAttempts(otp_id: number): Promise<IOtp | undefined> {
    const result = await this.pool.query<IOtp>(
      `UPDATE otps 
            SET attempts = attempts + 1 
            WHERE id = $1
            RETURNING *
            `,
      [otp_id]
    );

    return result.rows[0];
  }

  async markAsUsed(otp_id: number): Promise<IOtp | undefined> {
    const result = await this.pool.query<IOtp>(
      `UPDATE otps 
            SET is_used = true 
            WHERE id = $1 
            RETURNING *`,
      [otp_id]
    );

    return result.rows[0];
  }
}

import pool from "../../db";
import { getClient } from "../../db/transaction-context";
import { IUser, ICreateUser } from "./user.interface";

export class UserRepository {
  private pool = pool;

  async create(
    payload: ICreateUser & { password_hash: string }
  ): Promise<IUser | undefined> {
    const client = getClient(this.pool);
    const result = await client.query<IUser>(
      `INSERT INTO users (name, email, phone, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [payload.name, payload.email, payload.phone, payload.password_hash]
    );

    return result.rows[0];
  }

  async uniqueByEmail(email: string): Promise<boolean | undefined> {
    const normalizedEmail = email.toLowerCase().trim();
    const result = await this.pool.query<{ email_exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1) AS email_exists`,
      [normalizedEmail]
    );

    return result?.rows[0]?.email_exists;
  }

  async findByEmail(email: string): Promise<IUser | undefined> {
    const normalizedEmail = email.toLowerCase().trim();

    const result = await this.pool.query<IUser>(
      `SELECT * FROM users WHERE email = $1 LIMIT 1`,
      [normalizedEmail]
    );

    return result.rows[0];
  }

  async findByUserId(user_id: number): Promise<IUser | undefined> {
    const result = await this.pool.query<IUser>(
      `SELECT * FROM users WHERE id = $1 LIMIT 1`,
      [user_id]
    );

    return result.rows[0];
  }

  async updatePasswordToDB(
    user_id: number,
    password_hash: string
  ): Promise<IUser | undefined> {
    const result = await this.pool.query<IUser>(
      `UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING *`,
      [password_hash, user_id]
    );
    return result.rows[0];
  }

  async updatePhoneVerificationToDB(
    user_id: number
  ): Promise<IUser | undefined> {
    const result = await this.pool.query<IUser>(
      `UPDATE users SET is_email_verified = $1 WHERE id = $2 RETURNING *`,
      [user_id]
    );
    return result.rows[0];
  }

  async updateEmailVerified(user_id: number): Promise<IUser | undefined> {
    const result = await this.pool.query<IUser>(
      `UPDATE users SET is_email_verified = true WHERE id = $1 RETURNING *`,
      [user_id]
    );
    return result.rows[0];
  }

  async deleteAccount(user_id: number): Promise<IUser | undefined> {
    const result = await this.pool.query<IUser>(
      `UPDATE users
      SET status = 'deleted', deleted_at = $2
      WHERE id = $1 AND status != 'deleted'
      RETURNING *
      `,
      [user_id, new Date()]
    );

    return result.rows[0];
  }

  async recoverAccount(user_id: number): Promise<IUser | undefined> {
    const result = await this.pool.query<IUser>(
      `UPDATE users
      SET status = 'active', deleted_at = NULL
      WHERE id = $1 AND status = 'deleted'
      RETURNING *
      `,
      [user_id]
    );

    return result.rows[0];
  }
}

import pool from "../../db";
import QueryBuilder from "../../shared/QueryBuilder";
import { IPagination } from "../../types/pagination";
import { ITheater, ICreateTheater, IUpdateTheater } from "./theater.interface";

export class TheaterRepository {
  private pool = pool;

  async create(payload: ICreateTheater): Promise<ITheater | undefined> {
    const result = await this.pool.query<ITheater>(
      `INSERT INTO theaters (admin_id, name, code, location)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [payload.admin_id, payload.name, payload.code, payload.location]
    );
    return result.rows[0];
  }

  async retrieve(
    query: Partial<ITheater>
  ): Promise<{ theaters: ITheater[]; pagination: IPagination }> {
    const builder = new QueryBuilder("theaters", query)
      .search(["name", "location", "code"])
      .filter(["status"], { status: "active" })
      .sort()
      .select(["id", "name", "code", "location", "created_at", "updated_at"])
      .paginate();

    const theaters = await builder.execute<ITheater>();
    const pagination = await builder.getPaginationInfo();
    return { theaters, pagination };
  }

  async adminRetrieve(
    query: Partial<ITheater>
  ): Promise<{ theaters: ITheater[]; pagination: IPagination }> {
    const builder = new QueryBuilder("theaters", query)
      .search(["name", "location", "code"])
      .filter()
      .sort()
      .paginate();

    const theaters = await builder.execute<ITheater>();
    const pagination = await builder.getPaginationInfo();
    return { theaters, pagination };
  }

  async findById(id: number): Promise<ITheater | null> {
    const result = await this.pool.query<ITheater>(
      "SELECT * FROM theaters WHERE id = $1 LIMIT 1",
      [id]
    );
    return result.rows[0] ?? null;
  }

  async findByCode(code: string): Promise<ITheater | null> {
    const result = await this.pool.query<ITheater>(
      `SELECT * FROM theaters 
     WHERE UPPER(code) = UPPER($1) AND status = 'active' 
     ORDER BY id 
     LIMIT 1`,
      [code]
    );
    return result.rows[0] ?? null;
  }

  async update(id: number, payload: IUpdateTheater): Promise<ITheater | null> {
    const result = await this.pool.query<ITheater>(
      `UPDATE theaters SET
         name      = COALESCE($1, name),
         code      = COALESCE($2, code),
         location  = COALESCE($3, location),
         status = COALESCE($4, status)
       WHERE id = $5
       RETURNING *`,
      [
        payload.name ?? null,
        payload.code ?? null,
        payload.location ?? null,
        payload.status ?? null,
        id,
      ]
    );
    return result.rows[0] ?? null;
  }

  async softDelete(id: number): Promise<boolean> {
    const result = await this.pool.query(
      `UPDATE theaters SET status = deleted
       WHERE id = $1 AND status = active
       RETURNING id`,
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }
}

import { QueryResultRow } from "pg";
import pool from "../db";
import { IPagination } from "../types/pagination";

/**
 * Use:
 *   const builder = new QueryBuilder('movies', req.query)
 *     .search(['title', 'genre'])
 *     .filter()
 *     .sort()
 *     .paginate();
 *
 *   const data = await builder.execute<IMovie>();
 *   const meta = await builder.getPaginationInfo();
 */
class QueryBuilder {
  private table: string;
  private query: Record<string, any>;

  // WHERE conditions + tader value gula (parameterized)
  private conditions: string[] = [];
  private values: any[] = [];

  // sort + pagination
  private orderBy = "created_at DESC";
  private page = 1;
  private limit = 10;
  private usePagination = false;

  // SELECT column list (default sob column)
  private selectColumns = "*";

  constructor(table: string, query: Record<string, any> = {}) {
    this.table = table;
    this.query = query;
  }

  /**
   * Valid Postgres snake_case identifier kina check kore (column name guard).
   * Shudhu lowercase letter/digit/underscore, digit diye shuru noy.
   */
  private static isSafeIdentifier(name: string): boolean {
    return /^[a-z_][a-z0-9_]*$/.test(name);
  }

  /**
   * Ekta value ke parameter list e add kore tar placeholder ($1, $2...) return kore.
   * Ei helper tai SQL injection theke bachay.
   */
  private add(value: any): string {
    this.values.push(value);
    return `$${this.values.length}`;
  }

  /**
   * Kon column gula return hobe seta thik kore (default `*`).
   * Shudhu valid snake_case identifier allow kore — arbitrary string SELECT-e
   * dhuke jate na pare (defense-in-depth, column name interpolate hocche).
   * Public response e sensitive column (email iadi) hide korte kaje lage.
   */
  select(columns: string[]) {
    const safe = columns.filter((c) => QueryBuilder.isSafeIdentifier(c));
    if (safe.length) {
      this.selectColumns = safe.join(", ");
    }
    return this;
  }

  /** searchTerm thakle multiple field e ILIKE diye OR search (Mongo-r $or + $regex er moto) */
  search(searchableFields: string[]) {
    if (this.query.searchTerm) {
      const term = `%${this.query.searchTerm}%`;
      const ors = searchableFields.map(
        (field) => `${field} ILIKE ${this.add(term)}`
      );
      this.conditions.push(`(${ors.join(" OR ")})`);
    }
    return this;
  }

  /**
   * Exact-match filter + range filter.
   * @param allowedFields - shudhu ei column gula te filter hobe (jodi diye dao).
   *        Na dile query-r shob field (excluded chara) exact-match e jabe.
   */
  filter(
    allowedFields?: string[],
    extraFilters: Record<string, any> = {},
    priceField?: string
  ) {
    const queryObj = { ...this.query, ...extraFilters };

    // egula filter na, alada kaje lage — tai bad
    const excludedFields = [
      "page",
      "limit",
      "searchTerm",
      "sortBy",
      "startDate",
      "endDate",
      "minPrice",
      "maxPrice",
    ];
    excludedFields.forEach((el) => delete queryObj[el]);

    // ---- exact match (e.g. ?category=2D&status=published) ----
    for (const [key, value] of Object.entries(queryObj)) {
      if (value === undefined || value === "") continue;
      if (allowedFields && !allowedFields.includes(key)) continue; // safety
      // Defense-in-depth: column name interpolate hocche (value na), tai
      // allow-list bhule gele o arbitrary/malicious identifier jate SQL-e
      // na dhoke — valid snake_case identifier na hole skip.
      if (!QueryBuilder.isSafeIdentifier(key)) continue;
      this.conditions.push(`${key} = ${this.add(value)}`);
    }

    // ---- date range filter (?startDate=...&endDate=...) ----
    if (this.query.startDate) {
      this.conditions.push(`release_date >= ${this.add(this.query.startDate)}`);
    }
    if (this.query.endDate) {
      this.conditions.push(`release_date <= ${this.add(this.query.endDate)}`);
    }

    // ---- price range filter (?minPrice=...&maxPrice=...) ----
    // Opt-in only: caller must pass `priceField` (table-e price column thakle).
    // Na dile skip — jemon movies, jate `price` column nei.
    if (priceField) {
      if (this.query.minPrice) {
        this.conditions.push(
          `${priceField} >= ${this.add(Number(this.query.minPrice))}`
        );
      }
      if (this.query.maxPrice) {
        this.conditions.push(
          `${priceField} <= ${this.add(Number(this.query.maxPrice))}`
        );
      }
    }

    return this;
  }

  /**
   * sortBy onujayi ORDER BY set kore.
   * @param sortMap - per-table valid sort options. Default e shudhu `recent`.
   *        Ekhane price/onyo column dao SHUDHU jodi table-e oi column thake.
   * Unknown sortBy ashle safely `created_at DESC` e fallback kore (crash na).
   */
  sort(sortMap: Record<string, string> = { recent: "created_at DESC" }) {
    const key = this.query.sortBy?.toLowerCase();
    this.orderBy = (key && sortMap[key]) || "created_at DESC";
    return this;
  }

  /**
   * page + limit set kore (LIMIT / OFFSET execute() te add hobe).
   * @param maxLimit - ek page e max koto row (DoS guard)। Default 100.
   * page/limit ke positive integer e clamp kore — `?limit=999999`, `?limit=-5`,
   * `?page=-1`, NaN, float shob safely handle hoy.
   */
  paginate(maxLimit = 100) {
    const rawPage = Math.floor(Number(this.query.page));
    const rawLimit = Math.floor(Number(this.query.limit));

    this.page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 10;
    this.limit = Math.min(limit, maxLimit);

    this.usePagination = true;
    return this;
  }

  /** conditions thakle "WHERE a AND b ..." banay, na thakle empty string */
  private buildWhere(): string {
    return this.conditions.length
      ? `WHERE ${this.conditions.join(" AND ")}`
      : "";
  }

  /** final SELECT cholay ar rows return kore */
  async execute<T extends QueryResultRow = any>(): Promise<T[]> {
    let sql = `SELECT ${this.selectColumns} FROM ${this.table} ${this.buildWhere()} ORDER BY ${this.orderBy}`;

    if (this.usePagination) {
      const offset = (this.page - 1) * this.limit;
      // limit/offset computed integer — inline kora safe, tai values e dhukacchi na
      sql += ` LIMIT ${this.limit} OFFSET ${offset}`;
    }

    const result = await pool.query<T>(sql, this.values);
    return result.rows;
  }

  /** same filter diye total count + page info dey (frontend pagination er jonno) */
  async getPaginationInfo(): Promise<IPagination> {
    const sql = `SELECT COUNT(*)::int AS total FROM ${this.table} ${this.buildWhere()}`;
    const result = await pool.query<{ total: number }>(sql, this.values);

    const total = result.rows[0]?.total ?? 0;
    const totalPage = Math.ceil(total / this.limit);

    return {
      total,
      totalPage,
      page: this.page,
      limit: this.limit,
    };
  }
}

export default QueryBuilder;

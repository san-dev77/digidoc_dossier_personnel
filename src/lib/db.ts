import { Pool, QueryResultRow } from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://postgres:root@localhost:5432/digidoc_personnel";

export const db = new Pool({ connectionString });

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[] }> {
  const client = await db.connect();
  try {
    const res = await client.query<T & QueryResultRow>(text, params);
    return { rows: res.rows };
  } finally {
    client.release();
  }
}

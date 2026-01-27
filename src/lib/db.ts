import mysql from "mysql2/promise";

const connectionString =
  process.env.DATABASE_URL ||
  "mysql://root:root@localhost:3306/digidoc_personnel";

// Log de configuration (masqué)
const maskedUrl = connectionString.replace(/:([^:@]+)@/, ":****@");
console.log(`[DB-MYSQL2] Initialisation avec DB: ${maskedUrl}`);

export const db = mysql.createPool(connectionString);

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[] }> {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.query(text, params);
    return { rows: rows as T[] };
  } finally {
    connection.release();
  }
}

// Single place where the application connects to PostgreSQL.
// Standard SQL over a normal Postgres connection — no vendor SDK involved.
// Point DATABASE_URL at any Postgres server to move the app.
import postgres from "postgres";

type Sql = ReturnType<typeof postgres>;

let _sql: Sql | undefined;

function connectionString(): string {
  const url = process.env["DATABASE_URL"] ?? process.env["SUPABASE_DB_URL"];
  if (!url) throw new Error("DATABASE_URL is not configured");
  return url;
}

export function db(): Sql {
  if (!_sql) {
    _sql = postgres(connectionString(), {
      ssl: "require",
      max: 4,
      idle_timeout: 20,
      connect_timeout: 15,
      prepare: false,
    });
  }
  return _sql;
}

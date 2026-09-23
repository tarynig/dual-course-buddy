// Single place where the application connects to PostgreSQL.
// Standard SQL over a normal Postgres connection — no vendor SDK involved.
// Point DATABASE_URL at any Postgres server to move the app.
import postgres from "postgres";

type Sql = ReturnType<typeof postgres>;

function connectionString(): string {
  const url = process.env["DATABASE_URL"] ?? process.env["SUPABASE_DB_URL"];
  if (!url) throw new Error("DATABASE_URL is not configured");
  return url;
}

// A connection must not be shared between requests: the serverless runtime
// tears sockets down at the end of the request that opened them, and reusing
// one afterwards fails with "Network connection lost". So every call gets a
// short-lived connection that closes itself once idle.
export function db(): Sql {
  return postgres(connectionString(), {
    ssl: "require",
    max: 1,
    idle_timeout: 2,
    connect_timeout: 15,
    prepare: false,
    fetch_types: false,
  });
}

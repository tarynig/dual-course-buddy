// One contract, two transports.
//
// The application never writes query text. It asks for a named operation by
// name and gets JSON back — every operation lives in the database itself
// (database/app-data-functions.sql). Only the transport differs per server:
//
//   * Lovable's hosting   -> the Data API over HTTPS. A direct database socket
//     is not reachable there, which is why the old direct connection hung.
//   * the college's host  -> plain SQL over DATABASE_URL.
//
// The Data API is used whenever its credentials are present, so the demo
// address can never fall back to a socket it cannot open. On the college's own
// server there are no Data API credentials, so it uses DATABASE_URL instead.
//
// Nothing here is imported by browser code: only server functions and server
// routes call it.

type Payload = Record<string, unknown>;

// The generated client is typed against the tables that existed when it was
// written, so the saved routines are reached through this narrow shape instead.
type RpcClient = {
  rpc: (
    fn: string,
    args: { payload: unknown },
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

function dataApiAvailable(): boolean {
  return Boolean(
    process.env["SUPABASE_URL"] && process.env["SUPABASE_SERVICE_ROLE_KEY"],
  );
}

/** Which route the data takes on this server — useful in logs and docs. */
export function dataTransport(): "data-api" | "postgres" {
  return dataApiAvailable() ? "data-api" : "postgres";
}

async function throughDataApi<T>(fn: string, payload: Payload): Promise<T> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const client = supabaseAdmin as unknown as RpcClient;
  const { data, error } = await client.rpc(fn, { payload });
  if (error) throw new Error(`${fn} failed: ${error.message}`);
  return (data ?? null) as T;
}

// Saved operation names come from this file only, but the shape is checked
// anyway before it is placed into a statement.
const SAFE_NAME = /^[a-z_][a-z0-9_]*$/;

async function throughPostgres<T>(fn: string, payload: Payload): Promise<T> {
  if (!SAFE_NAME.test(fn)) throw new Error(`Unknown operation: ${fn}`);
  const { db } = await import("./db.server");
  const sql = db();
  const rows = await sql.unsafe<Array<{ result: T }>>(
    `select public.${fn}($1::jsonb) as result`,
    [JSON.stringify(payload)],
  );
  return (rows[0]?.result ?? null) as T;
}

/**
 * Runs one saved database operation and returns its JSON result.
 * Add a new operation by adding a function in database/app-data-functions.sql
 * and calling it here — no query text ever enters the application.
 */
export async function callData<T = unknown>(
  fn: string,
  payload: Payload = {},
): Promise<T> {
  return dataApiAvailable()
    ? throughDataApi<T>(fn, payload)
    : throughPostgres<T>(fn, payload);
}

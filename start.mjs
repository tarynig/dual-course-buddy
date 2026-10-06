import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(new URL("./.env", import.meta.url));
  } catch {
    // Ignore missing local env files; values may still be provided by the shell.
  }
}

process.env.NITRO_HOST = "0.0.0.0";
process.env.NITRO_PORT = process.env.PORT || "3000";

process.on("uncaughtExceptionMonitor", (error) => console.error("SYSTEM CRASH:", error));
process.on("exit", (code) => console.error("Node process exiting with code:", code));
process.on("beforeExit", (code) =>
  console.error("Node event loop is empty; no active server handle remains. Exit code:", code),
);

const serverEntry = new URL("./.output/server/index.mjs", import.meta.url);
console.log(
  "Startup diagnostics:",
  JSON.stringify({
    nodeVersion: process.version,
    cwd: process.cwd(),
    host: process.env.NITRO_HOST,
    port: process.env.NITRO_PORT,
    srvxLoaderPresent: Boolean(globalThis.__srvxLoader__),
    serverEntry: fileURLToPath(serverEntry),
    serverEntryExists: existsSync(serverEntry),
  }),
);

console.log("Importing Nitro server bundle...");
const startupTimeout = setTimeout(
  () => console.error("Nitro server import is still pending after 5 seconds"),
  5000,
);
try {
  await import(serverEntry.href);
  clearTimeout(startupTimeout);
  console.log("Nitro server bundle import completed");
} catch (error) {
  clearTimeout(startupTimeout);
  console.error("Failed to import Nitro server bundle:", error);
  process.exit(1);
}
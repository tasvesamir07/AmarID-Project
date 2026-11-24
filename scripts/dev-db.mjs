// Runs a real PostgreSQL for local development without Docker.
// Data lives in .data/postgres (gitignored). Stop with Ctrl+C.
//
// Prefer Docker? `docker compose up -d` gives the same database on the same port.
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, ".data", "postgres");
const port = Number(process.env.AMARID_DB_PORT ?? 54329);
const database = "amarid_dev";

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "amarid",
  password: "amarid",
  port,
  persistent: true,
  onLog: () => {},
  onError: (e) => console.error(String(e)),
});

const fresh = !existsSync(join(dataDir, "PG_VERSION"));
if (fresh) await pg.initialise();
await pg.start();
// Create the development database on first run; "already exists" is the normal case afterwards.
await pg.createDatabase(database).catch((e) => {
  if (!/already exists/i.test(String(e?.message ?? e))) throw e;
});
console.log(`PostgreSQL ready on localhost:${port} (database "${database}")`);

let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await pg.stop().catch(() => {});
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
process.on("SIGHUP", stop);
// Keep the process alive while Postgres runs as a child.
setInterval(() => {}, 1 << 30);

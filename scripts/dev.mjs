// One command for local development:
//   1. make sure .env exists
//   2. start PostgreSQL (embedded) unless something already listens on the port
//   3. apply migrations and seed demo partners
//   4. run the identity provider (3000) and the demo partners (3001)
import { spawn, spawnSync } from "node:child_process";
import { connect } from "node:net";
import { ensureEnv } from "./ensure-env.mjs";

// Use the directory npm started us in, not a path derived from this file's URL.
// On Windows the two can differ in drive-letter case ("d:\\" vs "D:\\"), and the
// dev server's hot-reload then sees every module under two names and reloads forever.
const root = process.cwd();
const port = Number(process.env.AMARID_DB_PORT ?? 54329);
const children = [];

function run(name, cmd, args) {
  const child = spawn(cmd, args, { cwd: root, stdio: "inherit", shell: true });
  child.on("exit", (code) => {
    if (code && code !== 0) console.error(`[${name}] exited with code ${code}`);
    shutdown();
  });
  children.push(child);
  return child;
}

function portOpen() {
  return new Promise((resolve) => {
    const socket = connect(port, "127.0.0.1");
    socket.once("connect", () => (socket.destroy(), resolve(true)));
    socket.once("error", () => resolve(false));
  });
}

async function waitForPort() {
  for (let i = 0; i < 120; i++) {
    if (await portOpen()) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`PostgreSQL did not start on port ${port}`);
}

let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGINT");
  setTimeout(() => process.exit(0), 1500);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

ensureEnv();
if (!(await portOpen())) run("db", "node", ["scripts/dev-db.mjs"]);
await waitForPort();

const setup = spawnSync("npm", ["run", "setup"], { cwd: root, stdio: "inherit", shell: true });
if (setup.status !== 0) {
  shutdown();
} else {
  run("id", "npm", ["run", "dev:id"]);
  run("partners", "npm", ["run", "dev:partners"]);
}

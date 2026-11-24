// Publishes the local stack on the internet through two Cloudflare quick
// tunnels (no account needed), so a phone or a remote reviewer can use it.
//
//   npm run tunnel
//
// Passkeys and OpenID Connect are bound to the public origin, so the apps must
// know their public URLs before they start. The order is therefore:
//   1. open both tunnels and read the URLs Cloudflare assigned
//   2. build both apps (unless --no-build)
//   3. seed the partners with redirect URIs on the tunnel URLs
//   4. start both apps in production mode with those URLs
//
// The URLs change on every run. `npm run dev` afterwards restores localhost.
import { spawn, spawnSync } from "node:child_process";
import { connect } from "node:net";
import { ensureEnv } from "./ensure-env.mjs";

const root = process.cwd();
const dbPort = Number(process.env.AMARID_DB_PORT ?? 54329);
const children = [];
let stopping = false;

function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGINT");
  setTimeout(() => process.exit(code), 1500);
}
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

function start(name, cmd, args, env = {}, onLine) {
  const child = spawn(cmd, args, { cwd: root, shell: true, env: { ...process.env, ...env }, stdio: onLine ? ["ignore", "pipe", "pipe"] : "inherit" });
  if (onLine) {
    const feed = (chunk) => String(chunk).split(/\r?\n/).forEach((line) => line && onLine(line));
    child.stdout.on("data", feed);
    child.stderr.on("data", feed);
  }
  child.on("exit", (code) => {
    if (!stopping) console.error(`[${name}] exited with code ${code}`);
    shutdown(code ?? 1);
  });
  children.push(child);
  return child;
}

const portOpen = (port) =>
  new Promise((resolve) => {
    const socket = connect(port, "127.0.0.1");
    socket.once("connect", () => (socket.destroy(), resolve(true)));
    socket.once("error", () => resolve(false));
  });

async function waitFor(check, what, tries = 240) {
  for (let i = 0; i < tries; i++) {
    if (await check()) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Timed out waiting for ${what}`);
}

/** Opens a quick tunnel to a local port and resolves with its public URL. */
function openTunnel(name, port) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`No tunnel URL for ${name} after 60 seconds. Is the internet reachable?`)), 60_000);
    start(`tunnel:${name}`, "npx", ["--yes", "cloudflared", "tunnel", "--no-autoupdate", "--url", `http://localhost:${port}`], {}, (line) => {
      const match = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/.exec(line);
      if (match) {
        clearTimeout(timer);
        resolve(match[0]);
      }
    });
  });
}

function run(label, args, env) {
  console.log(`\n> ${label}`);
  const result = spawnSync("npm", args, { cwd: root, shell: true, stdio: "inherit", env: { ...process.env, ...env } });
  if (result.status !== 0) throw new Error(`${label} failed`);
}

try {
  for (const port of [3000, 3001]) {
    if (await portOpen(port)) throw new Error(`Port ${port} is in use. Stop "npm run dev" first.`);
  }
  ensureEnv();
  if (!(await portOpen(dbPort))) start("db", "node", ["scripts/dev-db.mjs"]);
  await waitFor(() => portOpen(dbPort), "PostgreSQL");

  console.log("Opening tunnels…");
  const [appUrl, partnersUrl] = await Promise.all([openTunnel("id", 3000), openTunnel("partners", 3001)]);
  const env = { APP_URL: appUrl, PARTNERS_URL: partnersUrl };

  if (!process.argv.includes("--no-build")) run("build", ["run", "build"], env);
  run("database setup", ["run", "setup"], env);

  start("id", "npm", ["run", "start", "-w", "@amarid/id", "--", "-p", "3000"], env);
  start("partners", "npm", ["run", "start", "-w", "@amarid/partners", "--", "-p", "3001"], env);
  await waitFor(async () => (await portOpen(3000)) && (await portOpen(3001)), "the apps");

  console.log(`\nAmarID is public for as long as this command runs:\n\n  AmarID          ${appUrl}\n  Partner demos   ${partnersUrl}\n  MCP server      ${appUrl}/api/mcp\n\nPress Ctrl+C to close the tunnels.`);
} catch (error) {
  console.error(`\n${error.message}`);
  shutdown(1);
}

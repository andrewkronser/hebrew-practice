/* The DOM tests drive a real built bundle rather than importing components, so
   the bundle has to exist before any of them run. It used to be built by the
   npm script, wedged between two `node` invocations; here it is built once per
   run, whichever tests end up selected.

   It is skipped when the bundle is newer than everything it is built from, so
   a `--changed` run that only touches a test file doesn't pay for a rebuild. */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BUNDLE = path.join(ROOT, "dist-test", "bundle.js");

/** Newest mtime under a directory, ignoring the usual noise. */
function newestUnder(dir) {
  let newest = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    const stat = fs.statSync(full);
    newest = Math.max(newest, entry.isDirectory() ? newestUnder(full) : stat.mtimeMs);
  }
  return newest;
}

export async function setup() {
  const sources = Math.max(
    newestUnder(path.join(ROOT, "src")),
    fs.statSync(path.join(ROOT, "vite.test.config.js")).mtimeMs,
  );
  const built = fs.existsSync(BUNDLE) ? fs.statSync(BUNDLE).mtimeMs : 0;
  if (built > sources) return;

  /* Built in a child process rather than through vite's JS API, because Vitest
     sets NODE_ENV=test in its own process and @vitejs/plugin-react reads that
     to choose the JSX transform. Through the API you get a bundle that calls
     jsxDEV against a production React — it builds fine and then fails at
     runtime with "jsxDEV is not a function". Passing mode and defining
     NODE_ENV only fixes React's half of it, not the plugin's.

     A clean environment is the honest fix, and it is what `vite build` on the
     command line was doing before any of this. */
  execFileSync(
    path.join(ROOT, "node_modules", ".bin", "vite"),
    ["build", "--config", "vite.test.config.js", "--logLevel", "warn"],
    { cwd: ROOT, env: { ...process.env, NODE_ENV: "production" }, stdio: "inherit" },
  );
}

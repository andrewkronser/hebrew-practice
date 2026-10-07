import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  /* So a test can import the page component it covers — see the note in each
     test file about why it does. */
  plugins: [react()],

  test: {
    include: ["tests/**/*.test.mjs"],

    /* Each test builds its own jsdom with the shims Mantine needs, so the
       runner itself stays in node. Vitest's own jsdom environment would give
       every file a second, unused document. */
    environment: "node",

    /* The bundle the DOM tests drive. Built once per run, before any file. */
    globalSetup: ["./tests/global-setup.mjs"],

    /* A run answers a question, so show the per-check lines that answer it. */
    disableConsoleIntercept: true,

    /* These files are not in any test's import graph but every test depends on
       them, so `--changed` would miss them: the harness is shared by all seven
       DOM tests, the global setup decides whether the bundle is rebuilt, and
       the two vite configs decide what is in it. Listing them here forces the
       whole suite when one of them moves.

       Vitest's own defaults — package.json, lockfiles, vitest.config — still
       apply; these are added to them. */
    forceRerunTriggers: [
      "**/package.json/**",
      "**/{vitest,vite}.config.*/**",
      "**/vite.test.config.js",
      "**/tests/harness.mjs",
      "**/tests/global-setup.mjs",
    ],

    /* A DOM test walks a syllabus and can take a while; the default 5s is for
       unit tests. The body runs at module scope, so this covers collection. */
    /* Vitest defaults to one worker on a 2-core box, which runs the files one
       after another. These tests are mostly waiting on React inside jsdom
       rather than pegging a core, so letting them overlap is close to free. */
    maxWorkers: 2,

    testTimeout: 120000,
    hookTimeout: 120000,
  },
});

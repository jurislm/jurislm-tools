#!/usr/bin/env node

// Catches a `gh pr merge --subject` override that bypassed the pull-request
// title check while the release PR is still editable (design D3's residual
// gap, closed from the push side by design D4). Runs only on `push` to
// `main`: it reads DRONE_COMMIT_MESSAGE's first line and cannot block the
// merge that already happened, but it turns a silently wrong CHANGELOG
// entry into a red build on the commit that caused it.

import path from "node:path";
import { pathToFileURL } from "node:url";

import { PERMITTED_COMMIT_TYPES } from "./commit-types.mjs";
import { validateTitle } from "./validate-pr-title.mjs";

/**
 * Pure D4 push-side check as a function of an env-like object, so it is
 * unit-testable without spawning a subprocess. Only runs when
 * DRONE_PULL_REQUEST is empty (a push build, not a pull-request build) —
 * on a pull-request build validate-pr-title.mjs already covers the title,
 * and DRONE_COMMIT_MESSAGE there is an individual branch commit, not the
 * squash subject that will land on main.
 */
export function checkSquashSubject(env, permittedTypes = PERMITTED_COMMIT_TYPES) {
  const pullRequest = env.DRONE_PULL_REQUEST ?? "";

  if (pullRequest !== "") {
    return {
      exitCode: 0,
      message:
        `DRONE_PULL_REQUEST is set ("${pullRequest}"); this is a pull-request build, not a push ` +
        "to main. Skipping the squash-subject check (validate-pr-title.mjs already covers it).",
    };
  }

  const commitMessage = env.DRONE_COMMIT_MESSAGE ?? "";
  const subject = commitMessage.split("\n")[0] ?? "";

  const result = validateTitle(subject, permittedTypes);
  if (!result.valid) {
    return { exitCode: 1, message: result.reason };
  }

  return { exitCode: 0, message: `Squash subject OK: "${subject}"` };
}

function main() {
  const result = checkSquashSubject(process.env);
  if (result.exitCode === 0) {
    console.log(result.message);
  } else {
    console.error(result.message);
  }
  process.exitCode = result.exitCode;
}

const entryPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === entryPath) {
  main();
}

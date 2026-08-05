#!/usr/bin/env node

// Fails a pull-request build whose title is not a permitted Conventional
// Commits type (design D3): once `squash_merge_commit_title=PR_TITLE` is
// set, the PR title is the sole source of the squash subject release-please
// reads, so this is the correct artifact to gate before merge.

import path from "node:path";
import { pathToFileURL } from "node:url";

import { PERMITTED_COMMIT_TYPES } from "./commit-types.mjs";

const TITLE_PATTERN = /^([a-z]+)(?:\([^)]+\))?(!)?:\s+\S.*$/;

/**
 * Pure Conventional Commits title check. Does not read the environment.
 */
export function validateTitle(title, permittedTypes = PERMITTED_COMMIT_TYPES) {
  const match = TITLE_PATTERN.exec(title ?? "");

  if (!match) {
    return {
      valid: false,
      reason:
        `Title "${title}" has no Conventional Commits type (expected ` +
        `"type: description" or "type(scope): description"). Permitted ` +
        `types: ${permittedTypes.join(", ")}.`,
    };
  }

  const [, type] = match;
  if (!permittedTypes.includes(type)) {
    return {
      valid: false,
      reason:
        `Title "${title}" uses type "${type}", which is not permitted. ` +
        `Permitted types: ${permittedTypes.join(", ")}.`,
    };
  }

  return { valid: true };
}

/**
 * Design D6's three-state contract, as a pure function of an env-like
 * object so it is unit-testable without spawning a subprocess:
 *
 *   - DRONE_PULL_REQUEST empty        -> not a PR build, skip (exit 0)
 *   - DRONE_PULL_REQUEST_TITLE present -> validate it
 *   - DRONE_PULL_REQUEST set, title empty -> fail loudly (exit 1)
 *
 * Both variables are injected together by runner-go for `pull_request`
 * builds (verified in verification-logs/2026-08-05-pre-proposal-inventory.md
 * against environ/environ.go L186-189), so the third state contradicts the
 * verified contract and must not pass silently.
 */
export function checkPullRequestTitle(env, permittedTypes = PERMITTED_COMMIT_TYPES) {
  const pullRequest = env.DRONE_PULL_REQUEST ?? "";
  const title = env.DRONE_PULL_REQUEST_TITLE ?? "";

  if (pullRequest === "") {
    return {
      exitCode: 0,
      message: "Not a pull-request build (DRONE_PULL_REQUEST is empty); skipping PR title check.",
    };
  }

  if (title === "") {
    return {
      exitCode: 1,
      message:
        `DRONE_PULL_REQUEST is set ("${pullRequest}") but DRONE_PULL_REQUEST_TITLE is empty. ` +
        "This contradicts the verified runner-go environ contract, which injects both " +
        "variables together for pull_request builds; failing rather than skipping silently.",
    };
  }

  const result = validateTitle(title, permittedTypes);
  if (!result.valid) {
    return { exitCode: 1, message: result.reason };
  }

  return { exitCode: 0, message: `PR title OK: "${title}"` };
}

function main() {
  const result = checkPullRequestTitle(process.env);
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

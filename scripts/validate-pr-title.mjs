#!/usr/bin/env node

// Fails a pull-request build whose title is not a permitted Conventional
// Commits type (design D3): once `squash_merge_commit_title=PR_TITLE` is
// set, the PR title is the sole source of the squash subject release-please
// reads, so this is the correct artifact to gate before merge.

import path from "node:path";
import { pathToFileURL } from "node:url";

import { PERMITTED_COMMIT_TYPES } from "./commit-types.mjs";

// Overall shape: type, optional (scope), optional breaking "!", a literal
// colon, then everything after it verbatim (possibly empty, possibly
// missing the required space). Splitting the "does this even have a
// type:scope:description shape" question from the "is what follows the
// colon well-formed" question is what lets the two failure modes below get
// distinct messages instead of collapsing into one generic rejection.
const STRUCTURE_PATTERN = /^([a-z]+)(?:\([^)]+\))?(!)?:([\s\S]*)$/;

// Zero-width characters that are not matched by JS regex `\s` (so `\S`
// treats them as "real" content) but are invisible and carry no meaning as
// a commit description: ZERO WIDTH SPACE/NON-JOINER/JOINER and the
// zero-width no-break space (BOM). Deliberately a narrow, explicit
// blacklist of specific code points — not a broad Unicode whitespace
// property — so Traditional Chinese and other CJK titles, which are
// visible, meaningful characters, are never misclassified as blank.
const ZERO_WIDTH_PATTERN = /[\u200B-\u200D\uFEFF]/g;

function permittedTypesList(permittedTypes) {
  return permittedTypes.join(", ");
}

/**
 * Pure Conventional Commits title check. Does not read the environment.
 */
export function validateTitle(title, permittedTypes = PERMITTED_COMMIT_TYPES) {
  // `checkPullRequestTitle`/`checkSquashSubject` always pass a string (env
  // values default to ""), but this is an exported function other callers
  // can reach directly; coerce so a stray `undefined`/`null`/non-string
  // never gets echoed back literally into the rejection message.
  const raw = typeof title === "string" ? title : "";

  const structureMatch = STRUCTURE_PATTERN.exec(raw);

  if (!structureMatch) {
    return {
      valid: false,
      reason:
        `Title "${raw}" has no Conventional Commits type (expected ` +
        `"type: description" or "type(scope): description"). Permitted ` +
        `types: ${permittedTypesList(permittedTypes)}.`,
    };
  }

  const [, type, , rest] = structureMatch;

  if (!permittedTypes.includes(type)) {
    return {
      valid: false,
      reason:
        `Title "${raw}" uses type "${type}", which is not permitted. ` +
        `Permitted types: ${permittedTypesList(permittedTypes)}.`,
    };
  }

  if (!/^\s/.test(rest)) {
    return {
      valid: false,
      reason:
        `Title "${raw}" is missing a space after "${type}:" — Conventional ` +
        `Commits requires "${type}: description", with a space before the ` +
        "description.",
    };
  }

  if (rest.replace(ZERO_WIDTH_PATTERN, "").trim().length === 0) {
    return {
      valid: false,
      reason: `Title "${raw}" has no description after "${type}:" (only whitespace or invisible characters).`,
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

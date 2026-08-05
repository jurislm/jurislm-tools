import assert from "node:assert/strict";
import test from "node:test";

import {
  PERMITTED_COMMIT_TYPES,
  parseClaudeMdCommitTypes,
  readReleasePleaseChangelogTypes,
} from "./commit-types.mjs";

test("PERMITTED_COMMIT_TYPES is exactly feat, fix, docs, chore", () => {
  assert.deepEqual([...PERMITTED_COMMIT_TYPES].sort(), [
    "chore",
    "docs",
    "feat",
    "fix",
  ]);
});

test("release-please-config.json changelog-sections match the permitted types", () => {
  const types = readReleasePleaseChangelogTypes();

  assert.deepEqual([...types].sort(), [...PERMITTED_COMMIT_TYPES].sort());
});

test("CLAUDE.md Commit types list matches the permitted types", () => {
  const types = parseClaudeMdCommitTypes();

  assert.deepEqual([...types].sort(), [...PERMITTED_COMMIT_TYPES].sort());
});

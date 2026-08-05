import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  PERMITTED_COMMIT_TYPES,
  parseClaudeMdCommitTypes,
  readReleasePleaseChangelogTypes,
} from "./commit-types.mjs";

const roots = [];

test.afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function writeFixture(contents) {
  const root = mkdtempSync(path.join(tmpdir(), "commit-types-"));
  roots.push(root);
  writeFileSync(path.join(root, "CLAUDE.md"), contents);
  return root;
}

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

test("throws when the repository CLAUDE.md has exactly one Commit types marker", () => {
  // The real file is the one case this must never reject; asserted separately
  // from the drift test above so a future ambiguity check regression is
  // caught even if someone weakens the drift assertion.
  assert.doesNotThrow(() => parseClaudeMdCommitTypes());
});

test("throws when the Commit types marker appears more than once (ambiguous parse target)", () => {
  const root = writeFixture(
    [
      "Commit types:",
      "",
      "- `feat:` for new behavior.",
      "",
      "Some other section that happens to repeat the heading below.",
      "",
      "Commit types:",
      "",
      "- `fix:` for bug fixes.",
      "",
    ].join("\n"),
  );

  assert.throws(() => parseClaudeMdCommitTypes("CLAUDE.md", root), /more than once|ambiguous/i);
});

test("a single Commit types marker in a fixture still parses normally", () => {
  const root = writeFixture(
    ["Commit types:", "", "- `feat:` for new behavior.", "- `fix:` for bug fixes.", ""].join("\n"),
  );

  assert.deepEqual(parseClaudeMdCommitTypes("CLAUDE.md", root), ["feat", "fix"]);
});

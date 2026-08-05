import assert from "node:assert/strict";
import test from "node:test";

import { PERMITTED_COMMIT_TYPES } from "./commit-types.mjs";
import { checkPullRequestTitle, validateTitle } from "./validate-pr-title.mjs";

test("each permitted type passes", () => {
  for (const type of PERMITTED_COMMIT_TYPES) {
    const result = validateTitle(`${type}: something happened`);
    assert.equal(result.valid, true, `expected "${type}" to be permitted`);
  }
});

test("a scope passes", () => {
  const result = validateTitle("feat(jt-flow): add a new checker");
  assert.equal(result.valid, true);
});

test("a breaking-change marker passes", () => {
  const result = validateTitle("feat(jt-flow)!: change the checker contract");
  assert.equal(result.valid, true);
});

test("style, perf, refactor, test, and ci are rejected", () => {
  for (const type of ["style", "perf", "refactor", "test", "ci"]) {
    const result = validateTitle(`${type}: something happened`);
    assert.equal(result.valid, false, `expected "${type}" to be rejected`);
  }
});

test("a title with no Conventional Commits type is rejected", () => {
  const result = validateTitle("Bump the version number");
  assert.equal(result.valid, false);
});

test("the rejection message names both the observed title and the permitted set", () => {
  const title = "style: repaint the button";
  const result = validateTitle(title);

  assert.equal(result.valid, false);
  assert.match(result.reason, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  for (const type of PERMITTED_COMMIT_TYPES) {
    assert.match(result.reason, new RegExp(type));
  }
});

test("a release-please release title passes", () => {
  const result = validateTitle("chore(main): release 1.34.0");
  assert.equal(result.valid, true);
});

test("DRONE_PULL_REQUEST empty skips the check", () => {
  const result = checkPullRequestTitle({ DRONE_PULL_REQUEST: "", DRONE_PULL_REQUEST_TITLE: "" });

  assert.equal(result.exitCode, 0);
  assert.match(result.message, /skip/i);
});

test("DRONE_PULL_REQUEST set with a permitted title validates and passes", () => {
  const result = checkPullRequestTitle({
    DRONE_PULL_REQUEST: "179",
    DRONE_PULL_REQUEST_TITLE: "feat(jt-flow): add a new checker",
  });

  assert.equal(result.exitCode, 0);
});

test("DRONE_PULL_REQUEST set with a rejected title fails", () => {
  const result = checkPullRequestTitle({
    DRONE_PULL_REQUEST: "179",
    DRONE_PULL_REQUEST_TITLE: "style: repaint the button",
  });

  assert.equal(result.exitCode, 1);
});

test("DRONE_PULL_REQUEST set but the title is empty fails loudly rather than skipping", () => {
  const result = checkPullRequestTitle({ DRONE_PULL_REQUEST: "179", DRONE_PULL_REQUEST_TITLE: "" });

  assert.equal(result.exitCode, 1);
  assert.match(result.message, /DRONE_PULL_REQUEST_TITLE/);
});

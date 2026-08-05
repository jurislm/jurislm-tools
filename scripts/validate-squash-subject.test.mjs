import assert from "node:assert/strict";
import test from "node:test";

import { checkSquashSubject } from "./validate-squash-subject.mjs";

test("a conforming first line passes", () => {
  const result = checkSquashSubject({
    DRONE_PULL_REQUEST: "",
    DRONE_COMMIT_MESSAGE: "feat(jt-flow): add a new checker",
  });

  assert.equal(result.exitCode, 0);
});

test("an out-of-policy type fails", () => {
  const result = checkSquashSubject({
    DRONE_PULL_REQUEST: "",
    DRONE_COMMIT_MESSAGE: "style: repaint the button",
  });

  assert.equal(result.exitCode, 1);
});

test("only the first line of a multi-line commit message is considered", () => {
  const result = checkSquashSubject({
    DRONE_PULL_REQUEST: "",
    DRONE_COMMIT_MESSAGE:
      "feat(jt-flow): add a new checker\n\nstyle: this body line must not be read as the subject",
  });

  assert.equal(result.exitCode, 0);
});

test("chore(main): release 1.34.0 passes", () => {
  const result = checkSquashSubject({
    DRONE_PULL_REQUEST: "",
    DRONE_COMMIT_MESSAGE: "chore(main): release 1.34.0",
  });

  assert.equal(result.exitCode, 0);
});

test("a pull-request build (DRONE_PULL_REQUEST set) is skipped", () => {
  const result = checkSquashSubject({
    DRONE_PULL_REQUEST: "179",
    DRONE_COMMIT_MESSAGE: "style: repaint the button",
  });

  assert.equal(result.exitCode, 0);
  assert.match(result.message, /skip/i);
});

test("a tab after the colon in the squash subject is rejected — checkSquashSubject shares the fix via the imported validateTitle, confirmed here rather than assumed (CodeRabbit finding A)", () => {
  const result = checkSquashSubject({
    DRONE_PULL_REQUEST: "",
    DRONE_COMMIT_MESSAGE: "feat:\tdescription",
  });

  assert.equal(result.exitCode, 1);
  assert.match(result.message, /space/i);
});

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  classifyCommitSubjects,
  evaluateReleaseEligibility,
} from "./release-eligibility.mjs";

const repositoryRoot = path.resolve(new URL("../", import.meta.url).pathname);

function makeManifest(version = "1.37.1") {
  const directory = mkdtempSync(path.join(tmpdir(), "release-eligibility-"));
  const manifestPath = path.join(directory, ".release-please-manifest.json");
  writeFileSync(manifestPath, `${JSON.stringify({ ".": version })}\n`);
  return { directory, manifestPath };
}

function makeEnvironment(overrides = {}) {
  return {
    RELEASE_PLEASE_TOKEN: "test-token-that-must-not-leak",
    DRONE_REPO: "jurislm/jurislm-tools",
    DRONE_BRANCH: "main",
    ...overrides,
  };
}

function githubResponse(payload, { status = 200, link } = {}) {
  const headers = new Headers();
  if (link) headers.set("link", link);

  return {
    ok: status >= 200 && status < 300,
    status,
    headers,
    async json() {
      return payload;
    },
  };
}

function comparePage(commits, totalCommits = commits.length, options = {}) {
  return githubResponse(
    {
      total_commits: totalCommits,
      commits,
    },
    options,
  );
}

function commit(message) {
  return { sha: `${message}-sha`, commit: { message } };
}

test("an empty comparison is a deliberate skip", () => {
  const result = classifyCommitSubjects([]);

  assert.equal(result.eligible, false);
  assert.equal(result.exitCode, 10);
});

test("docs-only, chore-only, and mixed docs/chore comparisons are skipped", () => {
  for (const subjects of [
    ["docs: update the guide"],
    ["chore: refresh tooling"],
    ["docs: update the guide", "chore: refresh tooling"],
  ]) {
    const result = classifyCommitSubjects(subjects);

    assert.equal(result.eligible, false, subjects.join(", "));
    assert.equal(result.exitCode, 10, subjects.join(", "));
  }
});

test("a feat or fix comparison is eligible for release-pr", () => {
  for (const subject of ["feat: add a release guard", "fix(ci): stop a version bump"]) {
    const result = classifyCommitSubjects([subject]);

    assert.equal(result.eligible, true, subject);
    assert.equal(result.exitCode, 0, subject);
  }
});

test("an invalid commit subject fails closed", () => {
  assert.throws(
    () => classifyCommitSubjects(["Bump the version number"]),
    /invalid commit subject/i,
  );
});

test("missing release metadata fails before making a Compare request", async () => {
  const { directory, manifestPath } = makeManifest();
  let fetchCalled = false;

  try {
    await assert.rejects(
      evaluateReleaseEligibility({
        env: makeEnvironment({ DRONE_REPO: "" }),
        manifestPath,
        fetchImpl: async () => {
          fetchCalled = true;
          throw new Error("fetch must not be called");
        },
      }),
      /DRONE_REPO/i,
    );
    assert.equal(fetchCalled, false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("a Compare API failure fails closed", async () => {
  const { directory, manifestPath } = makeManifest();

  try {
    await assert.rejects(
      evaluateReleaseEligibility({
        env: makeEnvironment(),
        manifestPath,
        fetchImpl: async () => githubResponse({ message: "server error" }, { status: 500 }),
      }),
      /Compare API returned 500/i,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("every Compare page is evaluated before deciding", async () => {
  const { directory, manifestPath } = makeManifest();
  const calls = [];
  const nextUrl =
    "https://api.github.com/repos/jurislm/jurislm-tools/compare/v1.37.1...main?page=2";
  const responses = [
    comparePage([commit("docs: update the guide")], 2, {
      link: `<${nextUrl}>; rel="next"`,
    }),
    comparePage([commit("fix(ci): stop a version bump")], 2),
  ];

  try {
    const result = await evaluateReleaseEligibility({
      env: makeEnvironment(),
      manifestPath,
      fetchImpl: async (url, options) => {
        calls.push({ url, options });
        return responses.shift();
      },
    });

    assert.equal(result.eligible, true);
    assert.equal(result.exitCode, 0);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].url, "https://api.github.com/repos/jurislm/jurislm-tools/compare/v1.37.1...main");
    assert.equal(calls[1].url, nextUrl);
    assert.equal(calls[0].options.headers.Authorization, "Bearer test-token-that-must-not-leak");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("a pagination link outside the GitHub Compare endpoint is rejected before the token is forwarded", async () => {
  const { directory, manifestPath } = makeManifest();
  const calls = [];
  const untrustedUrl = "https://example.com/repos/attacker/repo/compare?page=2";

  try {
    await assert.rejects(
      evaluateReleaseEligibility({
        env: makeEnvironment(),
        manifestPath,
        fetchImpl: async (url, options) => {
          calls.push({ url, options });
          if (calls.length > 1) throw new Error("token forwarded to an untrusted host");
          return comparePage([commit("docs: update the guide")], 2, {
            link: `<${untrustedUrl}>; rel="next"`,
          });
        },
      }),
      /pagination link must stay within the GitHub Compare endpoint/i,
    );
    assert.equal(calls.length, 1);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("a truncated Compare response fails closed", async () => {
  const { directory, manifestPath } = makeManifest();

  try {
    await assert.rejects(
      evaluateReleaseEligibility({
        env: makeEnvironment(),
        manifestPath,
        fetchImpl: async () => comparePage([commit("docs: update the guide")], 2),
      }),
      /incomplete|every Compare page/i,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("the CLI returns a non-skip error without printing the release token", () => {
  const result = spawnSync(process.execPath, ["scripts/release-eligibility.mjs"], {
    cwd: repositoryRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      RELEASE_PLEASE_TOKEN: "secret-release-token",
      DRONE_REPO: "",
      DRONE_BRANCH: "main",
    },
  });
  const output = `${result.stdout}\n${result.stderr}`;

  assert.notEqual(result.status, 0);
  assert.notEqual(result.status, 10);
  assert.doesNotMatch(output, /secret-release-token/);
});

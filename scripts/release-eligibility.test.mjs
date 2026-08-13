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

function fixtureSha(value) {
  return value.toString(16).padStart(40, "0");
}

const TAG_SHA = fixtureSha(1);
const DOCS_SHA = fixtureSha(2);
const HEAD_SHA = fixtureSha(3);
const SIDE_TEST_SHA = fixtureSha(4);
const SIDE_FEATURE_SHA = fixtureSha(5);
const MISSING_SHA = fixtureSha(6);

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
    DRONE_COMMIT: HEAD_SHA,
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

function comparePage({ commits, totalCommits = commits.length, baseSha = TAG_SHA, link } = {}) {
  return githubResponse(
    {
      base_commit: { sha: baseSha },
      total_commits: totalCommits,
      commits,
    },
    { link },
  );
}

function parent(sha) {
  return { sha };
}

function commit({ sha, message, parents = [parent(TAG_SHA)] }) {
  return { sha, commit: { message }, parents };
}

function normalMainlineCommits() {
  return [
    commit({
      sha: DOCS_SHA,
      message: "docs: update the guide",
      parents: [parent(TAG_SHA)],
    }),
    commit({
      sha: HEAD_SHA,
      message: "feat(release): make a real release delivery",
      parents: [parent(DOCS_SHA)],
    }),
  ];
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
        env: makeEnvironment({ DRONE_COMMIT: "" }),
        manifestPath,
        fetchImpl: async () => {
          fetchCalled = true;
          throw new Error("fetch must not be called");
        },
      }),
      /DRONE_COMMIT/i,
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

test("eligibility binds Compare to immutable DRONE_COMMIT and follows its first-parent mainline", async () => {
  const { directory, manifestPath } = makeManifest();
  const calls = [];

  try {
    const result = await evaluateReleaseEligibility({
      env: makeEnvironment(),
      manifestPath,
      fetchImpl: async (url, options) => {
        calls.push({ url, options });
        return comparePage({ commits: normalMainlineCommits() });
      },
    });

    assert.equal(result.eligible, true);
    assert.equal(result.exitCode, 0);
    assert.equal(calls.length, 1);
    assert.equal(
      calls[0].url,
      `https://api.github.com/repos/jurislm/jurislm-tools/compare/v1.37.1...${HEAD_SHA}?per_page=100&page=1`,
    );
    assert.equal(calls[0].options.headers.Authorization, "Bearer test-token-that-must-not-leak");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("a valid GitHub default merge delivery ignores side-branch test commits", async () => {
  const { directory, manifestPath } = makeManifest();
  const commits = [
    commit({
      sha: DOCS_SHA,
      message: "docs: update the guide",
      parents: [parent(TAG_SHA)],
    }),
    commit({
      sha: SIDE_TEST_SHA,
      message: "test(ci): red test that never became a main delivery",
      parents: [parent(DOCS_SHA)],
    }),
    commit({
      sha: SIDE_FEATURE_SHA,
      message: "fix(ci): later branch work",
      parents: [parent(SIDE_TEST_SHA)],
    }),
    commit({
      sha: HEAD_SHA,
      message:
        "Merge pull request #216 from jurislm/codex/recover-release-delivery\n\n" +
        "feat(release): auto-merge trusted Release Please PRs\n\nRefs #215",
      parents: [parent(DOCS_SHA), parent(SIDE_FEATURE_SHA)],
    }),
  ];

  try {
    const result = await evaluateReleaseEligibility({
      env: makeEnvironment(),
      manifestPath,
      fetchImpl: async () => comparePage({ commits }),
    });

    assert.deepEqual(result, { eligible: true, exitCode: 0 });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("a malformed historical merge delivery fails closed", async () => {
  const { directory, manifestPath } = makeManifest();
  const malformedMerge = commit({
    sha: HEAD_SHA,
    message: "Merge branch feature/release into main\n\nfeat: unsafe recovery",
    parents: [parent(TAG_SHA), parent(SIDE_FEATURE_SHA)],
  });

  try {
    await assert.rejects(
      evaluateReleaseEligibility({
        env: makeEnvironment(),
        manifestPath,
        fetchImpl: async () => comparePage({ commits: [malformedMerge] }),
      }),
      /GitHub default merge|mainline delivery/i,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("a broken first-parent path fails closed", async () => {
  const { directory, manifestPath } = makeManifest();
  const incompleteHead = commit({
    sha: HEAD_SHA,
    message: "feat: delivery with a missing first parent",
    parents: [parent(MISSING_SHA)],
  });

  try {
    await assert.rejects(
      evaluateReleaseEligibility({
        env: makeEnvironment(),
        manifestPath,
        fetchImpl: async () => comparePage({ commits: [incompleteHead] }),
      }),
      /first-parent.*missing|mainline.*missing/i,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("every Compare page is collected before mainline eligibility is decided", async () => {
  const { directory, manifestPath } = makeManifest();
  const calls = [];
  const nextUrl =
    `https://api.github.com/repos/jurislm/jurislm-tools/compare/v1.37.1...${HEAD_SHA}?per_page=100&page=2`;
  const [docs, feature] = normalMainlineCommits();
  const responses = [
    comparePage({ commits: [docs], totalCommits: 2, link: `<${nextUrl}>; rel="next"` }),
    comparePage({ commits: [feature], totalCommits: 2 }),
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
    assert.equal(
      calls[0].url,
      `https://api.github.com/repos/jurislm/jurislm-tools/compare/v1.37.1...${HEAD_SHA}?per_page=100&page=1`,
    );
    assert.equal(calls[1].url, nextUrl);
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
          return comparePage({
            commits: normalMainlineCommits().slice(0, 1),
            totalCommits: 2,
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
        fetchImpl: async () => comparePage({ commits: normalMainlineCommits().slice(0, 1), totalCommits: 2 }),
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
      DRONE_REPO: "jurislm/jurislm-tools",
      DRONE_BRANCH: "main",
      DRONE_COMMIT: "",
    },
  });
  const output = `${result.stdout}\n${result.stderr}`;

  assert.notEqual(result.status, 0);
  assert.notEqual(result.status, 10);
  assert.doesNotMatch(output, /secret-release-token/);
});

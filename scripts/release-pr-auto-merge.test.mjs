import assert from "node:assert/strict";
import { test } from "node:test";

import { runReleasePrAutoMerge } from "./release-pr-auto-merge.mjs";

const REPOSITORY = "jurislm/jurislm-tools";
const BASE_BRANCH = "main";
const RELEASE_BRANCH = "release-please--branches--main";
const RELEASE_AUTHOR = "terry90918";
const TOKEN = "test-release-please-token";
const BASE_VERSION = "1.37.2";
const RELEASE_VERSION = "1.38.0";
const DRONE_COMMIT = "1111111111111111111111111111111111111111";
const RELEASE_HEAD_SHA = "2222222222222222222222222222222222222222";
const UPDATED_MAIN_SHA = "3333333333333333333333333333333333333333";
const MERGE_SHA = "4444444444444444444444444444444444444444";
const NEWER_BASE_SHA = "5555555555555555555555555555555555555555";
const UNRELATED_MAIN_SHA = "6666666666666666666666666666666666666666";
const UNRELATED_BASE_SHA = "7777777777777777777777777777777777777777";
const PULL_NUMBER = 213;

const RELEASE_BODY = `:robot: I have created a release *beep* *boop*
---

## [${RELEASE_VERSION}](https://github.com/${REPOSITORY}/compare/v${BASE_VERSION}...v${RELEASE_VERSION}) (2026-08-13)

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).`;

const PLUGIN_DEFINITIONS = [
  {
    name: "coolify",
    description: "管理 Coolify 基礎設施 — 部署應用、資料庫管理與問題診斷",
    keywords: ["coolify", "deployment", "infrastructure", "mcp"],
  },
  {
    name: "hetzner",
    description: "管理 Hetzner Cloud 資源 — 伺服器、SSH 金鑰、Volume 與 Storage Box",
    keywords: ["hetzner", "vps", "cloud", "mcp"],
  },
  {
    name: "langfuse",
    description: "Langfuse LLM 可觀測性 — Prompt 版本、Trace、Observation 與評分管理",
    keywords: ["langfuse", "observability", "tracing", "llm"],
  },
  {
    name: "repo-standards",
    description: "審查並套用 JurisLM repo 標準 — AGENTS.md、Drone、release workflow 與 worktree",
    keywords: ["release-please", "eslint", "drone", "standards"],
  },
  {
    name: "podcast-to-blog",
    description: "Apple Podcasts 連結轉部落格文章 — Whisper 轉錄與 AI 生成繁中文章",
    keywords: ["podcast", "blog", "transcription", "content"],
  },
  {
    name: "codebase-sync",
    description: "同步 codebase 文件 — 探索目錄結構並更新 README.md 與 CLAUDE.md",
    keywords: ["docs", "sync", "readme", "claude-md"],
  },
  {
    name: "learn-eval",
    description: "從 session 萃取可重複利用 pattern — 品質閘與 dedup 檢查",
    keywords: ["learning", "skills", "patterns", "session-analysis"],
  },
  {
    name: "jt-flow",
    description: "端到端落地需求的個人工作流 — Spectra、GitHub Flow 與交付驗證",
    keywords: ["workflow", "spectra", "github-flow", "delivery"],
  },
  {
    name: "higgsfield",
    description: "Higgsfield AI 圖像、影片、3D 與音訊生成 — 官方 remote MCP 與 CLI skills",
    keywords: ["image-generation", "video", "audio", "mcp"],
  },
];

const PLUGIN_PATHS = PLUGIN_DEFINITIONS.map(
  ({ name }) => `plugins/${name}/.claude-plugin/plugin.json`,
);
const RELEASE_ARTIFACTS = [
  ".release-please-manifest.json",
  "CHANGELOG.md",
  ...PLUGIN_PATHS,
  ".claude-plugin/marketplace.json",
];

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function contentResponse(text) {
  return jsonResponse({
    type: "file",
    encoding: "base64",
    content: Buffer.from(text, "utf8").toString("base64"),
  });
}

function pluginManifest(definition, version) {
  return {
    name: definition.name,
    description: definition.description,
    version,
    author: { name: "Terry Chen" },
    homepage: `https://github.com/${REPOSITORY}`,
    repository: `https://github.com/${REPOSITORY}`,
    license: "UNLICENSED",
    keywords: definition.keywords,
  };
}

function marketplace(version) {
  return {
    name: "jurislm-tools",
    description: "JurisLM 內部使用的基礎設施、可觀測性、內容處理與開發工作流 plugins",
    owner: { name: "Terry Chen", email: "zxtw17985321@gmail.com" },
    plugins: PLUGIN_DEFINITIONS.map((definition, index) => ({
      name: definition.name,
      source: `./plugins/${definition.name}`,
      description: definition.description,
      ...(index === 0 ? { version } : {}),
      author: { name: "Terry Chen" },
    })),
  };
}

function changelog(version) {
  const releaseBlock = `## [${version}](https://github.com/${REPOSITORY}/compare/v${BASE_VERSION}...v${version}) (2026-08-13)


### 🚀 New Features

* **release:** authorize the Release Please candidate
`;
  const baseHistory = `## [${BASE_VERSION}](https://github.com/${REPOSITORY}/compare/v1.37.1...v${BASE_VERSION}) (2026-08-11)


### 🐛 Bug Fixes

* **release:** prevent docs-only version bumps
`;
  return `# Changelog\n\n${version === RELEASE_VERSION ? `${releaseBlock}\n` : ""}${baseHistory}`;
}

function releaseContents(versionOverrides = {}) {
  const baseFiles = new Map([
    [".release-please-manifest.json", JSON.stringify({ ".": BASE_VERSION })],
    ["CHANGELOG.md", changelog(BASE_VERSION)],
  ]);
  const headFiles = new Map([
    [".release-please-manifest.json", JSON.stringify({ ".": RELEASE_VERSION })],
    ["CHANGELOG.md", changelog(RELEASE_VERSION)],
  ]);

  for (const definition of PLUGIN_DEFINITIONS) {
    const path = `plugins/${definition.name}/.claude-plugin/plugin.json`;
    baseFiles.set(path, JSON.stringify(pluginManifest(definition, BASE_VERSION)));
    headFiles.set(
      path,
      JSON.stringify(
        pluginManifest(definition, versionOverrides[path] ?? RELEASE_VERSION),
      ),
    );
  }

  baseFiles.set(
    ".claude-plugin/marketplace.json",
    JSON.stringify(marketplace(BASE_VERSION)),
  );
  headFiles.set(
    ".claude-plugin/marketplace.json",
    JSON.stringify(marketplace(RELEASE_VERSION)),
  );

  return { baseFiles, headFiles };
}

function releaseCandidate(overrides = {}) {
  const candidate = {
    number: PULL_NUMBER,
    state: "open",
    draft: false,
    title: `chore(main): release ${RELEASE_VERSION}`,
    body: RELEASE_BODY,
    changed_files: RELEASE_ARTIFACTS.length,
    user: { login: RELEASE_AUTHOR },
    base: {
      ref: BASE_BRANCH,
      sha: DRONE_COMMIT,
      repo: { full_name: REPOSITORY },
    },
    head: {
      ref: RELEASE_BRANCH,
      sha: RELEASE_HEAD_SHA,
      repo: { full_name: REPOSITORY },
    },
    mergeable: true,
  };

  return {
    ...candidate,
    ...overrides,
    user: { ...candidate.user, ...(overrides.user ?? {}) },
    base: { ...candidate.base, ...(overrides.base ?? {}) },
    head: { ...candidate.head, ...(overrides.head ?? {}) },
  };
}

function changedFiles(files = RELEASE_ARTIFACTS) {
  return files.map((filename) => ({
    filename,
    status: "modified",
    additions: 1,
    deletions: 1,
    changes: 2,
  }));
}

function mainRef(sha) {
  return { ref: "refs/heads/main", object: { type: "commit", sha } };
}

function createGitHubMock({
  candidates = [releaseCandidate()],
  candidateDetail = candidates[0],
  files = changedFiles(),
  mainSha = DRONE_COMMIT,
  compareStatus = "ahead",
  versionOverrides = {},
  failure = null,
} = {}) {
  const requests = [];
  const contents = releaseContents(versionOverrides);
  const pullsPath = `/repos/${REPOSITORY}/pulls`;
  const candidatePath = `${pullsPath}/${PULL_NUMBER}`;
  const filesPath = `${candidatePath}/files`;
  const mergePath = `${candidatePath}/merge`;
  const mainRefPath = `/repos/${REPOSITORY}/git/ref/heads/${BASE_BRANCH}`;
  const comparePrefix = `/repos/${REPOSITORY}/compare/`;
  const contentPrefix = `/repos/${REPOSITORY}/contents/`;

  const fetchImpl = async (input, init = {}) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    const record = {
      method: request.method,
      url: request.url,
      body: init.body == null ? null : String(init.body),
    };
    requests.push(record);

    if (failure?.pathname === url.pathname) {
      if (failure.mode === "throw") {
        throw new Error("simulated GitHub API failure");
      }
      return jsonResponse({ message: "simulated GitHub API failure" }, failure.status ?? 503);
    }

    if (request.method === "GET" && url.pathname === pullsPath) {
      return jsonResponse(candidates);
    }
    if (request.method === "GET" && url.pathname === candidatePath) {
      return jsonResponse(candidateDetail);
    }
    if (request.method === "GET" && url.pathname === filesPath) {
      return jsonResponse(files);
    }
    if (request.method === "GET" && url.pathname === mainRefPath) {
      return jsonResponse(mainRef(mainSha));
    }
    if (request.method === "GET" && url.pathname.startsWith(comparePrefix)) {
      return jsonResponse({ status: compareStatus });
    }
    if (request.method === "GET" && url.pathname.startsWith(contentPrefix)) {
      const path = decodeURIComponent(url.pathname.slice(contentPrefix.length));
      const ref = url.searchParams.get("ref");
      const text = ref === candidateDetail?.base?.sha
        ? contents.baseFiles.get(path)
        : contents.headFiles.get(path);
      if (text === undefined) {
        return jsonResponse({ message: `missing fixture for ${path}@${ref}` }, 404);
      }
      return contentResponse(text);
    }
    if (request.method === "PUT" && url.pathname === mergePath) {
      return jsonResponse({ merged: true, sha: MERGE_SHA });
    }

    throw new Error(`unexpected mocked GitHub request: ${request.method} ${url.href}`);
  };

  return {
    fetchImpl,
    requests,
    mergeRequests: () => requests.filter(({ method }) => method === "PUT"),
  };
}

function invoke(mock, overrides = {}) {
  return runReleasePrAutoMerge({
    token: TOKEN,
    commitSha: DRONE_COMMIT,
    fetchImpl: mock.fetchImpl,
    sleep: async () => {},
    ...overrides,
  });
}

function assertNoMerge(mock) {
  assert.equal(mock.mergeRequests().length, 0, "rejected or superseded candidates must not merge");
}

test("a valid Release Please candidate makes exactly one merge request with its validated head SHA", async () => {
  const mock = createGitHubMock();

  await invoke(mock);

  const mergeRequests = mock.mergeRequests();
  assert.equal(mergeRequests.length, 1);
  assert.equal(mergeRequests[0].method, "PUT");
  assert.equal(
    new URL(mergeRequests[0].url).pathname,
    `/repos/${REPOSITORY}/pulls/${PULL_NUMBER}/merge`,
  );
  assert.deepEqual(JSON.parse(mergeRequests[0].body), {
    sha: RELEASE_HEAD_SHA,
    merge_method: "merge",
  });
});

test("no open Release Please candidate is a successful no-op", async () => {
  const mock = createGitHubMock({ candidates: [] });

  await invoke(mock);

  assertNoMerge(mock);
});

for (const [label, overrides] of [
  ["an untrusted author", { user: { login: "untrusted-user" } }],
  [
    "an untrusted release branch",
    { head: { ref: "refs/heads/feature/not-release-please" } },
  ],
  ["a missing Release Please body marker", { body: "ordinary pull request" }],
]) {
  test(`rejects ${label} without a merge request`, async () => {
    const mock = createGitHubMock({ candidates: [releaseCandidate(overrides)] });

    await assert.rejects(invoke(mock));

    assertNoMerge(mock);
  });
}

test("an extra changed artifact is rejected without a merge request", async () => {
  const mock = createGitHubMock({
    candidates: [releaseCandidate({ changed_files: RELEASE_ARTIFACTS.length + 1 })],
    files: changedFiles([...RELEASE_ARTIFACTS, "README.md"]),
  });

  await assert.rejects(invoke(mock));

  assertNoMerge(mock);
});

test("a missing configured release artifact is rejected without a merge request", async () => {
  const files = RELEASE_ARTIFACTS.slice(0, -1);
  const candidate = releaseCandidate({ changed_files: files.length });
  const mock = createGitHubMock({
    candidates: [candidate],
    candidateDetail: candidate,
    files: changedFiles(files),
  });

  await assert.rejects(invoke(mock));

  assertNoMerge(mock);
});

test("a deleted configured release artifact is rejected without a merge request", async () => {
  const files = changedFiles();
  files.at(-1).status = "removed";
  const mock = createGitHubMock({ files });

  await assert.rejects(invoke(mock));

  assertNoMerge(mock);
});

test("plugin version drift is rejected without a merge request", async () => {
  const driftedPluginPath = "plugins/repo-standards/.claude-plugin/plugin.json";
  const mock = createGitHubMock({
    versionOverrides: { [driftedPluginPath]: "1.38.1" },
  });

  await assert.rejects(invoke(mock));

  assertNoMerge(mock);
});

for (const [label, overrides] of [
  ["an invalid base SHA", { base: { sha: "not-a-git-sha" } }],
  ["an invalid head SHA", { head: { sha: "also-not-a-git-sha" } }],
]) {
  test(`rejects ${label} without a merge request`, async () => {
    const mock = createGitHubMock({ candidates: [releaseCandidate(overrides)] });

    await assert.rejects(invoke(mock));

    assertNoMerge(mock);
  });
}

test("a non-mergeable candidate is rejected without a merge request", async () => {
  const mock = createGitHubMock({
    candidates: [releaseCandidate({ mergeable: false })],
    candidateDetail: releaseCandidate({ mergeable: false }),
  });

  await assert.rejects(invoke(mock));

  assertNoMerge(mock);
});

test("a candidate based on a newer delivery is a successful no-op", async () => {
  const mock = createGitHubMock({
    candidates: [releaseCandidate({ base: { sha: NEWER_BASE_SHA } })],
    candidateDetail: releaseCandidate({ base: { sha: NEWER_BASE_SHA } }),
    compareStatus: "ahead",
  });

  await invoke(mock);

  assertNoMerge(mock);
  assert.ok(
    mock.requests.some((request) => request.url.includes(`/compare/${DRONE_COMMIT}...${NEWER_BASE_SHA}`)),
    "candidate-base supersession must use ancestry comparison",
  );
});

test("a candidate based on an unrelated delivery is rejected without a merge request", async () => {
  const candidate = releaseCandidate({ base: { sha: UNRELATED_BASE_SHA } });
  const mock = createGitHubMock({
    candidates: [candidate],
    candidateDetail: candidate,
    compareStatus: "diverged",
  });

  await assert.rejects(invoke(mock));

  assertNoMerge(mock);
});

test("any changed main tip during final recheck is a successful no-op", async () => {
  const mock = createGitHubMock({ mainSha: UNRELATED_MAIN_SHA });

  await invoke(mock);

  assertNoMerge(mock);
  assert.ok(
    mock.requests.some((request) => request.url.endsWith(`/git/ref/heads/${BASE_BRANCH}`)),
    "the final decision must re-read the main ref",
  );
});

test("a GitHub API failure is rejected without a merge request", async () => {
  const mock = createGitHubMock({
    failure: { pathname: `/repos/${REPOSITORY}/pulls`, status: 503 },
  });

  await assert.rejects(invoke(mock));

  assertNoMerge(mock);
});

test("a GitHub API timeout is rejected without a merge request", async () => {
  let requestCount = 0;
  const fetchImpl = (_input, init = {}) =>
    new Promise((_resolve, reject) => {
      requestCount += 1;
      const signal = init.signal;
      assert.ok(signal, "GitHub requests must have a timeout signal");
      signal.addEventListener(
        "abort",
        () => reject(new Error("simulated GitHub API timeout")),
        { once: true },
      );
    });

  await assert.rejects(
    runReleasePrAutoMerge({
      token: TOKEN,
      commitSha: DRONE_COMMIT,
      fetchImpl,
      requestTimeoutMs: 10,
    }),
    /timed out/i,
  );

  assert.equal(requestCount, 1);
});

test("a GitHub API response-body timeout is rejected without a merge request", async () => {
  let requestCount = 0;
  const fetchImpl = (_input, init = {}) => {
    requestCount += 1;
    return Promise.resolve({
      ok: true,
      status: 200,
      text: () =>
        new Promise((_resolve, reject) => {
          const signal = init.signal;
          assert.ok(signal, "GitHub requests must keep the timeout signal while reading a response");
          signal.addEventListener(
            "abort",
            () => reject(new Error("simulated GitHub API response-body timeout")),
            { once: true },
          );
        }),
    });
  };
  let deadlineId;
  const deadline = new Promise((_, reject) => {
    deadlineId = setTimeout(() => reject(new Error("test deadline exceeded")), 100);
  });

  try {
    await assert.rejects(
      Promise.race([
        runReleasePrAutoMerge({
          token: TOKEN,
          commitSha: DRONE_COMMIT,
          fetchImpl,
          requestTimeoutMs: 10,
        }),
        deadline,
      ]),
      /timed out/i,
    );
  } finally {
    clearTimeout(deadlineId);
  }

  assert.equal(requestCount, 1);
});

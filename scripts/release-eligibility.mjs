#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { validateTitle } from "./validate-pr-title.mjs";

export const SKIP_EXIT_CODE = 10;

const GITHUB_API_URL = "https://api.github.com";
const RELEASABLE_TYPES = new Set(["feat", "fix"]);
const SUBJECT_PATTERN = /^([a-z]+)(?:\([^)]+\))?!?:/u;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u;
const SHA_PATTERN = /^[0-9a-f]{40}$/iu;
const GITHUB_DEFAULT_MERGE_SUBJECT =
  /^Merge pull request #[1-9]\d* from [A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*$/u;

function requireNonEmptyString(value, name) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing ${name}.`);
  }

  return value;
}

function parseRepository(repository) {
  const value = requireNonEmptyString(repository, "DRONE_REPO");
  const parts = value.split("/");

  if (parts.length !== 2 || parts.some((part) => part.length === 0)) {
    throw new Error("DRONE_REPO must use the owner/name format.");
  }

  return parts;
}

function requireSha(value, name) {
  const sha = requireNonEmptyString(value, name);
  if (!SHA_PATTERN.test(sha)) {
    throw new Error(`${name} must be a 40-character Git SHA.`);
  }
  return sha;
}

function readManifestVersion(manifestPath) {
  let manifest;

  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    throw new Error(`Unable to read release manifest: ${error.message}`);
  }

  const version = manifest?.["."];
  if (typeof version !== "string" || !SEMVER_PATTERN.test(version)) {
    throw new Error("The release manifest is missing a valid package version at key \".\".");
  }

  return version;
}

function buildCompareUrl({ repository, commitSha, version }) {
  const [owner, name] = parseRepository(repository);
  const targetCommit = requireSha(commitSha, "DRONE_COMMIT");

  return `${GITHUB_API_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}` +
    `/compare/${encodeURIComponent(`v${version}`)}...${encodeURIComponent(targetCommit)}` +
    "?per_page=100&page=1";
}

function parseNextLink(linkHeader) {
  if (typeof linkHeader !== "string" || linkHeader.length === 0) return null;

  for (const link of linkHeader.split(",")) {
    const match = /<([^>]+)>\s*;\s*rel="?([^";]+)"?/u.exec(link);
    if (match?.[2].split(/\s+/u).includes("next")) return match[1];
  }

  return null;
}

function validateNextUrl(nextUrl, firstUrl) {
  let candidate;
  let expected;

  try {
    candidate = new URL(nextUrl);
    expected = new URL(firstUrl);
  } catch {
    throw new Error("GitHub Compare pagination link must stay within the GitHub Compare endpoint.");
  }

  if (
    candidate.origin !== expected.origin ||
    candidate.pathname !== expected.pathname ||
    candidate.username.length > 0 ||
    candidate.password.length > 0
  ) {
    throw new Error("GitHub Compare pagination link must stay within the GitHub Compare endpoint.");
  }

  return candidate.href;
}

function extractCommitMessage(commit, index) {
  const message = commit?.commit?.message;
  if (typeof message !== "string" || message.length === 0) {
    throw new Error(`Compare response commit ${index + 1} is missing a commit message.`);
  }

  return message;
}

function normalizeCompareCommit(commit, index) {
  const sha = requireSha(commit?.sha, `Compare response commit ${index + 1} SHA`);
  if (!Array.isArray(commit?.parents) || commit.parents.length === 0) {
    throw new Error(`Compare response commit ${index + 1} is missing parents.`);
  }

  return {
    sha,
    message: extractCommitMessage(commit, index),
    parents: commit.parents.map((parent, parentIndex) =>
      requireSha(
        parent?.sha,
        `Compare response commit ${index + 1} parent ${parentIndex + 1} SHA`,
      ),
    ),
  };
}

function mainlineDeliveryCommits({ commits, baseSha, commitSha }) {
  if (!Array.isArray(commits)) throw new Error("Compare commits must be an array.");

  const bySha = new Map();
  for (const [index, commit] of commits.entries()) {
    const normalized = normalizeCompareCommit(commit, index);
    if (bySha.has(normalized.sha)) {
      throw new Error(`Compare response repeats commit ${normalized.sha}.`);
    }
    bySha.set(normalized.sha, normalized);
  }

  const deliveries = [];
  const seen = new Set();
  let currentSha = commitSha;
  while (currentSha !== baseSha) {
    if (seen.has(currentSha)) {
      throw new Error("Compare response first-parent mainline is cyclic.");
    }
    const current = bySha.get(currentSha);
    if (!current) {
      throw new Error(`Compare response first-parent mainline is missing commit ${currentSha}.`);
    }
    seen.add(currentSha);
    deliveries.push(current);
    currentSha = current.parents[0];
  }

  return deliveries.reverse();
}

function extractMainlineDeliverySubject(commit, index) {
  const lines = commit.message.split(/\r?\n/u);
  const subject = lines[0];

  if (commit.parents.length === 1) return subject;
  if (commit.parents.length !== 2) {
    throw new Error(`Mainline delivery ${index + 1} has an unsupported parent count.`);
  }
  if (!GITHUB_DEFAULT_MERGE_SUBJECT.test(subject) || lines[1] !== "") {
    throw new Error(`Mainline delivery ${index + 1} is not an exact GitHub default merge delivery.`);
  }

  const bodyTitle = lines.slice(2).find((line) => line.length > 0);
  if (!bodyTitle) {
    throw new Error(`Mainline delivery ${index + 1} is missing a GitHub default merge body title.`);
  }
  const validation = validateTitle(bodyTitle);
  if (!validation.valid) {
    throw new Error(`Mainline delivery ${index + 1} has an invalid merge body title: ${validation.reason}`);
  }

  return bodyTitle;
}

function responseLinkHeader(response) {
  if (typeof response?.headers?.get !== "function") return "";
  return response.headers.get("link") ?? response.headers.get("Link") ?? "";
}

export function classifyCommitSubjects(subjects) {
  if (!Array.isArray(subjects)) {
    throw new Error("Compare commit subjects must be an array.");
  }

  let eligible = false;

  for (const [index, subject] of subjects.entries()) {
    const validation = validateTitle(subject);
    if (!validation.valid) {
      throw new Error(`Invalid commit subject at index ${index}: ${validation.reason}`);
    }

    const match = SUBJECT_PATTERN.exec(subject);
    if (!match) {
      throw new Error(`Invalid commit subject at index ${index}: ${subject}`);
    }

    if (RELEASABLE_TYPES.has(match[1])) eligible = true;
  }

  return {
    eligible,
    exitCode: eligible ? 0 : SKIP_EXIT_CODE,
  };
}

export async function fetchCompareCommits({
  repository,
  commitSha,
  version,
  token,
  fetchImpl = globalThis.fetch,
}) {
  requireNonEmptyString(token, "GITHUB_API_TOKEN");
  if (typeof fetchImpl !== "function") throw new Error("GitHub Compare fetch is unavailable.");

  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "User-Agent": "jurislm-tools-release-eligibility",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const commits = [];
  const seenUrls = new Set();
  const firstUrl = buildCompareUrl({ repository, commitSha, version });
  let nextUrl = firstUrl;
  let expectedTotal;
  let baseSha;

  while (nextUrl) {
    if (seenUrls.has(nextUrl)) throw new Error("GitHub Compare pagination repeated a page.");
    seenUrls.add(nextUrl);

    let response;
    try {
      response = await fetchImpl(nextUrl, { headers });
    } catch (error) {
      throw new Error(`GitHub Compare request failed: ${error.message}`);
    }

    if (!response?.ok) {
      throw new Error(`GitHub Compare API returned ${response?.status ?? "an unknown status"}.`);
    }

    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      throw new Error(`GitHub Compare response was not valid JSON: ${error.message}`);
    }

    if (
      !Number.isInteger(payload?.total_commits) ||
      payload.total_commits < 0 ||
      !Array.isArray(payload.commits)
    ) {
      throw new Error("GitHub Compare response is missing a valid total_commits or commits array.");
    }

    const pageBaseSha = requireSha(
      payload?.base_commit?.sha,
      "GitHub Compare response base commit SHA",
    );
    if (baseSha === undefined) baseSha = pageBaseSha;
    if (pageBaseSha !== baseSha) {
      throw new Error("GitHub Compare response changed its base commit between pages.");
    }

    if (expectedTotal === undefined) expectedTotal = payload.total_commits;
    if (payload.total_commits !== expectedTotal) {
      throw new Error("GitHub Compare response changed total_commits between pages.");
    }

    commits.push(...payload.commits);
    if (commits.length > expectedTotal) {
      throw new Error("GitHub Compare response contains more commits than total_commits.");
    }

    const parsedNextUrl = parseNextLink(responseLinkHeader(response));
    nextUrl = parsedNextUrl === null ? null : validateNextUrl(parsedNextUrl, firstUrl);
  }

  if (commits.length !== expectedTotal) {
    throw new Error(
      `GitHub Compare response is incomplete: received ${commits.length} of ` +
        `${expectedTotal} commits.`,
    );
  }

  return { baseSha, commits };
}

export async function evaluateReleaseEligibility({
  env = process.env,
  manifestPath = path.join(process.cwd(), ".release-please-manifest.json"),
  fetchImpl = globalThis.fetch,
} = {}) {
  const token = requireNonEmptyString(env.GITHUB_API_TOKEN, "GITHUB_API_TOKEN");
  const repository = requireNonEmptyString(env.DRONE_REPO, "DRONE_REPO");
  requireNonEmptyString(env.DRONE_BRANCH, "DRONE_BRANCH");
  const commitSha = requireSha(env.DRONE_COMMIT, "DRONE_COMMIT");
  const version = readManifestVersion(manifestPath);
  const comparison = await fetchCompareCommits({
    repository,
    commitSha,
    version,
    token,
    fetchImpl,
  });

  const deliveries = mainlineDeliveryCommits({
    commits: comparison.commits,
    baseSha: comparison.baseSha,
    commitSha,
  });
  return classifyCommitSubjects(deliveries.map(extractMainlineDeliverySubject));
}

function redactToken(message, token) {
  if (typeof token !== "string" || token.length === 0) return message;
  return message.split(token).join("[REDACTED]");
}

export async function runCli(env = process.env) {
  try {
    const result = await evaluateReleaseEligibility({ env });
    if (result.eligible) {
      console.log("Release eligibility: feat/fix commit found; running release-pr.");
      return 0;
    }

    console.log("Release eligibility: no feat/fix commit found; skipping release-pr.");
    return SKIP_EXIT_CODE;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `Release eligibility unavailable; release-pr will not run: ${redactToken(
        message,
        env.GITHUB_API_TOKEN,
      )}`,
    );
    return 1;
  }
}

const entryPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === entryPath) {
  runCli().then((exitCode) => {
    process.exitCode = exitCode;
  });
}

#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const REPOSITORY = "jurislm/jurislm-tools";
const BASE_BRANCH = "main";
const RELEASE_BRANCH = "release-please--branches--main";
const RELEASE_AUTHOR = "terry90918";
const RELEASE_BODY_START = ":robot: I have created a release *beep* *boop*";
const RELEASE_BODY_FOOTER =
  "This PR was generated with [Release Please](https://github.com/googleapis/release-please).";
const RELEASE_TITLE = /^chore\(main\): release ((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*))$/u;
const GITHUB_API = "https://api.github.com";
const MAX_MERGEABLE_ATTEMPTS = 6;
const MERGEABLE_POLL_DELAY_MS = 5_000;
const REQUEST_TIMEOUT_MS = 30_000;

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredRecord(value, label) {
  if (!isRecord(value)) throw new Error(`invalid release PR shape: ${label}`);
  return value;
}

function requiredString(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`invalid release PR shape: ${label}`);
  }
  return value;
}

function requiredSha(value, label) {
  const sha = requiredString(value, label);
  if (!/^[0-9a-f]{40}$/iu.test(sha)) {
    throw new Error(`invalid release PR shape: ${label}`);
  }
  return sha;
}

function requiredPositiveInteger(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
  return value;
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalize(value[key])]),
  );
}

function equalJson(left, right) {
  return JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));
}

function parseJsonObject(text, label) {
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error(`${label} is not valid JSON`);
  }
  if (!isRecord(value)) throw new Error(`${label} JSON must be an object`);
  return value;
}

function parseVersion(version) {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u.exec(version);
  if (!match) return null;
  const parts = match.slice(1).map(Number);
  return parts.every(Number.isSafeInteger) ? parts : null;
}

function versionGreater(target, base) {
  const targetParts = parseVersion(target);
  const baseParts = parseVersion(base);
  if (!targetParts || !baseParts) return false;
  for (let index = 0; index < targetParts.length; index += 1) {
    if (targetParts[index] > baseParts[index]) return true;
    if (targetParts[index] < baseParts[index]) return false;
  }
  return false;
}

function parseJsonPath(jsonPath) {
  if (typeof jsonPath !== "string" || !jsonPath.startsWith("$.")) {
    throw new Error(`unsupported release config jsonpath: ${jsonPath}`);
  }

  return jsonPath
    .slice(2)
    .split(".")
    .flatMap((segment) => {
      const match = /^([A-Za-z0-9_-]+)(?:\[(\d+)\])?$/u.exec(segment);
      if (!match) throw new Error(`unsupported release config jsonpath: ${jsonPath}`);
      return match[2] === undefined ? [match[1]] : [match[1], Number(match[2])];
    });
}

function getJsonPathValue(document, segments, label) {
  let current = document;
  for (const segment of segments) {
    if (!isRecord(current) && !Array.isArray(current)) {
      throw new Error(`${label} is missing`);
    }
    current = current[segment];
  }
  return current;
}

function replaceJsonPathValue(document, segments, value, label) {
  let current = document;
  for (const segment of segments.slice(0, -1)) {
    if (!isRecord(current) && !Array.isArray(current)) {
      throw new Error(`${label} is missing`);
    }
    current = current[segment];
  }
  if (!isRecord(current) && !Array.isArray(current)) {
    throw new Error(`${label} is missing`);
  }
  current[segments.at(-1)] = value;
}

function readTrustedReleaseContract() {
  const readJson = (relativePath) =>
    parseJsonObject(readFileSync(resolve(process.cwd(), relativePath), "utf8"), relativePath);
  const config = readJson("release-please-config.json");
  const packageConfig = requiredRecord(config.packages, "release config packages")["."];
  const releaseConfig = requiredRecord(packageConfig, "release config packages[.]");
  const changelogPath = requiredString(releaseConfig["changelog-path"], "release config changelog-path");
  const extraFiles = releaseConfig["extra-files"];
  if (!Array.isArray(extraFiles) || extraFiles.length === 0) {
    throw new Error("release config extra-files must be a non-empty array");
  }

  const versionFiles = extraFiles.map((entry, index) => {
    const file = requiredRecord(entry, `release config extra-files[${index}]`);
    if (file.type !== "json") {
      throw new Error(`release config extra-files[${index}] must be a JSON version file`);
    }
    const path = requiredString(file.path, `release config extra-files[${index}].path`);
    const jsonPath = requiredString(
      file.jsonpath,
      `release config extra-files[${index}].jsonpath`,
    );
    return { path, jsonPath, segments: parseJsonPath(jsonPath) };
  });

  const allowedFiles = [".release-please-manifest.json", changelogPath, ...versionFiles.map((file) => file.path)];
  if (new Set(allowedFiles).size !== allowedFiles.length) {
    throw new Error("release config release artifact paths must be unique");
  }

  return { changelogPath, versionFiles, allowedFiles };
}

function selectReleaseCandidate(value) {
  if (!Array.isArray(value)) throw new Error("release PR response must be an array");
  if (value.length === 0) return null;
  if (value.length !== 1) throw new Error("multiple release PR candidates found");

  const pull = requiredRecord(value[0], "pull request");
  if (!Number.isSafeInteger(pull.number) || pull.number <= 0) {
    throw new Error("invalid release PR shape: number");
  }
  if (requiredString(pull.state, "state") !== "open") {
    throw new Error("release PR candidate is not open");
  }
  if (pull.draft !== false) throw new Error("release PR candidate must not be a draft");

  const title = requiredString(pull.title, "title");
  const titleMatch = RELEASE_TITLE.exec(title);
  if (!titleMatch) throw new Error("release PR title is not an exact release title");

  const body = requiredString(pull.body, "body");
  if (!body.startsWith(RELEASE_BODY_START) || !body.includes(RELEASE_BODY_FOOTER)) {
    throw new Error("release PR body is missing the official Release Please markers");
  }

  const user = requiredRecord(pull.user, "user");
  if (user.login !== RELEASE_AUTHOR) throw new Error("release PR author is not allowed");

  const base = requiredRecord(pull.base, "base");
  const baseRepo = requiredRecord(base.repo, "base.repo");
  if (baseRepo.full_name !== REPOSITORY || base.ref !== BASE_BRANCH) {
    throw new Error("release PR base identity is not allowed");
  }

  const head = requiredRecord(pull.head, "head");
  const headRepo = requiredRecord(head.repo, "head.repo");
  if (headRepo.full_name !== REPOSITORY || head.ref !== RELEASE_BRANCH) {
    throw new Error("release PR head identity is not allowed");
  }

  return {
    number: pull.number,
    version: titleMatch[1],
    baseSha: requiredSha(base.sha, "base.sha"),
    headSha: requiredSha(head.sha, "head.sha"),
  };
}

function validateChangedFiles(value, allowedFiles) {
  if (!Array.isArray(value) || value.length !== allowedFiles.length) {
    throw new Error("release PR must change exactly the configured release artifacts");
  }

  const actualFiles = value.map((entry, index) => {
    const file = requiredRecord(entry, `files[${index}]`);
    if (file.status !== "modified") {
      throw new Error("release PR artifacts must be modified in place");
    }
    return requiredString(file.filename, `files[${index}].filename`);
  });

  if (actualFiles.sort().join("\n") !== [...allowedFiles].sort().join("\n")) {
    throw new Error("release PR must change exactly the configured release artifacts");
  }
}

function decodeFileContent(value, label) {
  const content = requiredRecord(value, label);
  if (content.type !== "file" || content.encoding !== "base64") {
    throw new Error(`${label} is not a base64 file response`);
  }
  const encoded = requiredString(content.content, `${label}.content`).replaceAll("\n", "");
  if (
    encoded.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]*={0,2}$/u.test(encoded) ||
    Buffer.from(encoded, "base64").toString("base64") !== encoded
  ) {
    throw new Error(`${label} content is not valid base64`);
  }
  return Buffer.from(encoded, "base64").toString("utf8");
}

function validateReleaseContents({ contract, candidate, baseContents, headContents }) {
  const manifestPath = ".release-please-manifest.json";
  const baseManifest = parseJsonObject(baseContents.get(manifestPath), "base release manifest");
  const headManifest = parseJsonObject(headContents.get(manifestPath), "head release manifest");
  const baseVersion = baseManifest["."];
  if (typeof baseVersion !== "string" || !versionGreater(candidate.version, baseVersion)) {
    throw new Error("release manifest base version must be earlier than the candidate version");
  }
  if (headManifest["."] !== candidate.version) {
    throw new Error("release manifest version does not match the release PR title");
  }
  const baseManifestWithoutVersion = { ...baseManifest };
  const headManifestWithoutVersion = { ...headManifest };
  delete baseManifestWithoutVersion["."];
  delete headManifestWithoutVersion["."];
  if (!equalJson(baseManifestWithoutVersion, headManifestWithoutVersion)) {
    throw new Error("release manifest fields other than the version changed");
  }

  for (const file of contract.versionFiles) {
    const baseDocument = parseJsonObject(baseContents.get(file.path), `base ${file.path}`);
    const headDocument = parseJsonObject(headContents.get(file.path), `head ${file.path}`);
    const baseValue = getJsonPathValue(baseDocument, file.segments, `${file.path} ${file.jsonPath}`);
    const headValue = getJsonPathValue(headDocument, file.segments, `${file.path} ${file.jsonPath}`);
    if (baseValue !== baseVersion) {
      throw new Error(`${file.path} base version does not match the release manifest`);
    }
    if (headValue !== candidate.version) {
      throw new Error(`${file.path} version does not match the release manifest`);
    }
    replaceJsonPathValue(headDocument, file.segments, baseValue, `${file.path} ${file.jsonPath}`);
    if (!equalJson(baseDocument, headDocument)) {
      throw new Error(`${file.path} fields other than the configured version changed`);
    }
  }

  const baseChangelog = baseContents.get(contract.changelogPath);
  const headChangelog = headContents.get(contract.changelogPath);
  const changelogHeader = "# Changelog\n\n";
  if (
    !baseChangelog.startsWith(changelogHeader) ||
    !headChangelog.startsWith(changelogHeader)
  ) {
    throw new Error("CHANGELOG must preserve the standard header");
  }
  const baseHistory = baseChangelog.slice(changelogHeader.length);
  const headHistory = headChangelog.slice(changelogHeader.length);
  if (baseHistory.length === 0 || !headHistory.endsWith(baseHistory)) {
    throw new Error("CHANGELOG must preserve the complete base content");
  }
  const newReleaseBlock = headHistory.slice(0, headHistory.length - baseHistory.length);
  if (!newReleaseBlock.startsWith(`## [${candidate.version}](`)) {
    throw new Error("CHANGELOG must prepend the candidate version entry");
  }
}

function createGitHubClient({ token, fetchImpl, requestTimeoutMs }) {
  if (typeof fetchImpl !== "function") throw new Error("GitHub fetch implementation is unavailable");

  return async function request(apiPath, init = {}) {
    const method = init.method ?? "GET";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
    let response;
    let text;
    try {
      response = await fetchImpl(`${GITHUB_API}${apiPath}`, {
        ...init,
        signal: controller.signal,
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
          ...init.headers,
        },
      });
      text = await response.text();
    } catch {
      if (controller.signal.aborted) {
        throw new Error(`GitHub API ${method} ${apiPath.split("?")[0]} timed out`);
      }
      throw new Error(`GitHub API ${method} ${apiPath.split("?")[0]} request failed`);
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new Error(`GitHub API ${method} ${apiPath.split("?")[0]} failed with status ${response.status}`);
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`GitHub API ${method} ${apiPath.split("?")[0]} did not return valid JSON`);
    }
  };
}

function mergeResult(value) {
  const result = requiredRecord(value, "merge response");
  if (result.merged !== true) throw new Error("GitHub merge response did not confirm a merge");
  return requiredSha(result.sha, "merge response sha");
}

export async function runReleasePrAutoMerge({
  token,
  commitSha,
  fetchImpl = globalThis.fetch,
  sleep = (milliseconds) => new Promise((resolveSleep) => setTimeout(resolveSleep, milliseconds)),
  requestTimeoutMs = REQUEST_TIMEOUT_MS,
} = {}) {
  if (typeof token !== "string" || token.length === 0) {
    throw new Error("RELEASE_PLEASE_TOKEN is required");
  }
  const expectedCommitSha = requiredSha(commitSha, "DRONE_COMMIT");
  if (typeof sleep !== "function") throw new Error("sleep must be a function");
  const timeoutMs = requiredPositiveInteger(requestTimeoutMs, "requestTimeoutMs");

  const contract = readTrustedReleaseContract();
  const request = createGitHubClient({ token, fetchImpl, requestTimeoutMs: timeoutMs });
  const query = new URLSearchParams({
    state: "open",
    base: BASE_BRANCH,
    head: `jurislm:${RELEASE_BRANCH}`,
    per_page: "100",
  });
  let candidate = selectReleaseCandidate(
    await request(`/repos/${REPOSITORY}/pulls?${query.toString()}`),
  );
  if (!candidate) return { status: "no-op" };

  const detailValue = await request(`/repos/${REPOSITORY}/pulls/${candidate.number}`);
  const detailedCandidate = selectReleaseCandidate([detailValue]);
  if (!detailedCandidate || detailedCandidate.number !== candidate.number) {
    throw new Error("release PR candidate changed before validation");
  }
  if (
    detailedCandidate.baseSha !== candidate.baseSha ||
    detailedCandidate.headSha !== candidate.headSha
  ) {
    throw new Error("release PR SHA changed before validation");
  }
  candidate = detailedCandidate;

  if (candidate.baseSha !== expectedCommitSha) {
    const comparison = requiredRecord(
      await request(
        `/repos/${REPOSITORY}/compare/${encodeURIComponent(expectedCommitSha)}...${encodeURIComponent(candidate.baseSha)}?per_page=1`,
      ),
      "commit comparison",
    );
    if (requiredString(comparison.status, "commit comparison status") === "ahead") {
      return { status: "no-op" };
    }
    throw new Error("release PR base SHA does not match the triggering Drone commit");
  }

  const changedFileCount = requiredRecord(detailValue, "pull request detail").changed_files;
  if (changedFileCount !== contract.allowedFiles.length) {
    throw new Error("release PR changed file count does not match the release artifact contract");
  }
  const changedFiles = await request(
    `/repos/${REPOSITORY}/pulls/${candidate.number}/files?per_page=100&page=1`,
  );
  validateChangedFiles(changedFiles, contract.allowedFiles);

  const baseContents = new Map();
  const headContents = new Map();
  await Promise.all(
    contract.allowedFiles.flatMap((filePath) => [
      (async () => {
        baseContents.set(
          filePath,
          decodeFileContent(
            await request(
              `/repos/${REPOSITORY}/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(candidate.baseSha)}`,
            ),
            `${filePath}@${candidate.baseSha}`,
          ),
        );
      })(),
      (async () => {
        headContents.set(
          filePath,
          decodeFileContent(
            await request(
              `/repos/${REPOSITORY}/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(candidate.headSha)}`,
            ),
            `${filePath}@${candidate.headSha}`,
          ),
        );
      })(),
    ]),
  );
  validateReleaseContents({ contract, candidate, baseContents, headContents });

  let mergeable = false;
  for (let attempt = 1; attempt <= MAX_MERGEABLE_ATTEMPTS; attempt += 1) {
    const mergeabilityValue = await request(`/repos/${REPOSITORY}/pulls/${candidate.number}`);
    const mergeabilityCandidate = selectReleaseCandidate([mergeabilityValue]);
    if (!mergeabilityCandidate) throw new Error("release PR disappeared during mergeability validation");
    if (
      mergeabilityCandidate.baseSha !== candidate.baseSha ||
      mergeabilityCandidate.headSha !== candidate.headSha
    ) {
      throw new Error("release PR SHA changed during mergeability validation");
    }
    const mergeability = requiredRecord(mergeabilityValue, "mergeability pull request").mergeable;
    if (mergeability === true) {
      mergeable = true;
      break;
    }
    if (mergeability === false) throw new Error("release PR is not mergeable");
    if (mergeability !== null) throw new Error("invalid release PR shape: mergeable");
    if (attempt < MAX_MERGEABLE_ATTEMPTS) await sleep(MERGEABLE_POLL_DELAY_MS);
  }
  if (!mergeable) throw new Error("release PR mergeability check timed out");

  const currentRef = requiredRecord(
    await request(`/repos/${REPOSITORY}/git/ref/heads/${BASE_BRANCH}`),
    "main branch ref",
  );
  const currentSha = requiredSha(requiredRecord(currentRef.object, "main branch ref.object").sha, "main branch ref.object.sha");
  if (currentSha !== expectedCommitSha) return { status: "no-op" };

  const mergeSha = mergeResult(
    await request(`/repos/${REPOSITORY}/pulls/${candidate.number}/merge`, {
      method: "PUT",
      body: JSON.stringify({ sha: candidate.headSha, merge_method: "merge" }),
    }),
  );
  return { status: "merged", pullNumber: candidate.number, mergeSha };
}

async function main() {
  const result = await runReleasePrAutoMerge({
    token: process.env.RELEASE_PLEASE_TOKEN,
    commitSha: process.env.DRONE_COMMIT,
  });
  if (result.status === "merged") {
    console.log(`Merged release-please Release PR #${result.pullNumber}.`);
  } else {
    console.log("Release PR auto-merge: no-op.");
  }
}

const entryPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryPath) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : "unknown release PR auto-merge failure";
    console.error(`release PR auto-merge failed: ${message}`);
    process.exitCode = 1;
  });
}

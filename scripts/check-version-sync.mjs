#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

function readJson(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

function getJsonPathValue(document, jsonPath) {
  if (!jsonPath.startsWith("$.")) {
    throw new Error(`Unsupported jsonpath: ${jsonPath}`);
  }

  const segments = jsonPath
    .slice(2)
    .split(".")
    .flatMap((segment) => {
      const match = /^([A-Za-z0-9_-]+)(?:\[(\d+)\])?$/.exec(segment);
      if (!match) {
        throw new Error(`Unsupported jsonpath segment: ${segment}`);
      }

      const parts = [match[1]];
      if (match[2] !== undefined) {
        parts.push(Number(match[2]));
      }
      return parts;
    });

  let current = document;
  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

const manifest = readJson(".release-please-manifest.json");
const expectedVersion = manifest["."];

if (typeof expectedVersion !== "string" || expectedVersion.length === 0) {
  fail('Invalid manifest version at .release-please-manifest.json -> ["."]');
}

const config = readJson("release-please-config.json");
const packageConfig = config?.packages?.["."];
const extraFiles = packageConfig?.["extra-files"];

if (!Array.isArray(extraFiles)) {
  fail('Missing packages["."].extra-files in release-please-config.json');
}

for (const entry of extraFiles) {
  if (entry?.type !== "json") {
    continue;
  }

  if (typeof entry.path !== "string" || typeof entry.jsonpath !== "string") {
    fail("Invalid extra-files entry in release-please-config.json");
  }

  const document = readJson(entry.path);
  const actualVersion = getJsonPathValue(document, entry.jsonpath);

  if (typeof actualVersion !== "string" || actualVersion.length === 0) {
    fail(`Missing or invalid version at ${entry.path} -> ${entry.jsonpath}`);
  }

  if (actualVersion !== expectedVersion) {
    fail(
      `Version mismatch: ${entry.path} -> ${actualVersion} (expected ${expectedVersion})`,
    );
  }
}

console.log(`Version sync OK: ${expectedVersion}`);
